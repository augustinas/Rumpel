/*
 * Copyright (C) 2017 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 4, 2017
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { PasswordChangeFailureResInterface } from '../password-change-failure-res.interface';

declare const zxcvbn: any;
const MIN_PASSWORD_STRENGTH = 3; // Integer from 0-4, see https://github.com/dropbox/zxcvbn for more info
const ERROR_MESSAGES = {
  authenticationError: 'ERROR: Current password incorrect',
  passwordStrengthError: 'ERROR: Password is too weak. Please make it harder to guess.',
  passwordMatchError: 'Provided passwords do not match'
};

@Component({
  selector: 'rum-password-change',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss']
})
export class PasswordChangeComponent implements OnInit {
  @ViewChild('currentPass') currentPass: ElementRef;
  public colorMapping = ['red', 'red', 'orange', 'green', 'green'];
  public evaluationMapping = ['Too guessable', 'Weak', 'So-so', 'Strong', 'Very Strong'];
  public resetToken: string;
  public successMessage: string;
  public passwordStrength: any;
  public loadingText: string;
  public hatName: string;
  public hatDomain: string;
  public passwordChanged = false;
  public errorType: string;

  constructor(private route: ActivatedRoute,
              private authSvc: AuthService) { }

  ngOnInit() {
    this.route.params.subscribe((routeParams) => {
      this.resetToken = routeParams['resetToken'] || null;
    });

    const host = window.location.hostname;

    this.hatName = host.substring(0, host.indexOf('.'));
    this.hatDomain = host.substring(host.indexOf('.'));
  }

  errorText(): string {
    return ERROR_MESSAGES[this.errorType] || '';
  }

  clearErrors() {
    this.errorType = '';
    this.successMessage = null;
    this.passwordStrength = null;
  }

  analysePassword(password: string): void {
    this.passwordStrength = zxcvbn(password);
  }

  changePass(newPass: string, confirmPass: string) {
    if (newPass === confirmPass) {
      const passwordStrength = zxcvbn(newPass);

      if (passwordStrength.score < MIN_PASSWORD_STRENGTH) {
        this.errorType = 'passwordStrengthError';

        return;
      }

      if (this.resetToken) {
        this.resetPassword(this.resetToken, newPass);
      } else {
        this.changePassword(this.currentPass.nativeElement.value, newPass);
      }
    } else {
      this.errorType = 'passwordMatchError';
    }
  }

  private changePassword(oldPassword: string, newPassword: string) {
    this.loadingText = 'Saving new password';
    this.authSvc.changePassword(oldPassword, newPassword)
      .subscribe(
        _ => {
          this.loadingText = null;
          this.successMessage = 'Password changed. You can now log into your HAT with your new password.';
          this.authSvc.logout();
          this.passwordChanged = true;
        },
        (error: HttpErrorResponse) => {
          this.loadingText = null;
          this.errorType = error.status === 403 ? 'authenticationError' : 'passwordStrengthError';
        }
      );
  }

  private resetPassword(resetToken: string, newPassword: string) {
    this.loadingText = 'Saving new password';
    this.authSvc.resetPassword(resetToken, newPassword)
      .subscribe(
        _ => {
          this.loadingText = null;
          this.successMessage = 'Password reset. You can now log into your HAT with your new password.';
          this.passwordChanged = true;
        },
        (error: HttpErrorResponse) => {
          this.loadingText = null;
          this.errorType = error.status === 403 ? 'authenticationError' : 'passwordStrengthError';
        }
      );
  }
}
