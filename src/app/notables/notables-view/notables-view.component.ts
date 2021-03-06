/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

import { Component, OnInit } from '@angular/core';
import { NotablesService } from '../notables.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { DialogService } from '../../core/dialog.service';

import { ConfirmBoxComponent } from '../../core/confirm-box/confirm-box.component';
import { Notable, Profile } from '../../shared/interfaces';
import { HatRecord } from '../../shared/interfaces/hat-record.interface';
import { ProfileSharingConfig } from '../../shared/interfaces/profile.interface';

@Component({
  selector: 'rum-notables-view',
  templateUrl: './notables-view.component.html',
  styleUrls: ['./notables-view.component.scss']
})
export class NotablesViewComponent implements OnInit {
  public notables: HatRecord<Notable>[];
  public profile: { photo: { url: string; shared: boolean; }; };
  public filter: string;

  constructor(private notablesSvc: NotablesService,
              private profilesSvc: ProfilesService,
              private dialogSvc: DialogService) { }

  ngOnInit() {
    this.filter = '';
    this.notables = [];

    this.notablesSvc.data$.subscribe((notables: HatRecord<Notable>[]) => {
      this.notables = notables;
    });

    this.notablesSvc.getInitData(50);

    this.profile = {
      photo: { url: '', shared: false }
    };

    // this.profilesSvc.getPicture().subscribe(result => {
    //   if (result && result.url) {
    //     this.profile.photo.url = result.url;
    //   }
    // });

    this.profilesSvc.profileData$.subscribe((profile: { values: Profile; share: ProfileSharingConfig; }) => {
      const latestSnapshot = profile;
      if (latestSnapshot.share && latestSnapshot.share.photo) {
        this.profile.photo.shared = latestSnapshot.share.photo.avatar;
      }
    });
  }

  filterBy(category: string) {
    this.filter = category;
  }

  changeNotable(event) {
    switch (event.action) {
      case 'edit':
        this.notablesSvc.editNotable(event.notable);
        window.scrollTo(0, 100);
        break;

      case 'remove':
        if (event.notable.isShared) {
          this.dialogSvc.createDialog(ConfirmBoxComponent, {
            message: `Deleting a note that has already been shared will not delete it at the destination.
          To remove a note from the external site, first make it private. You may then choose to delete it.`,
            accept: () => {
              // event.target.parentNode.parentNode.className += " removed-item";
              setTimeout(() => this.notablesSvc.delete(event.notable), 900);
            }
          });
        } else {
          // event.target.parentNode.parentNode.className += " removed-item";
          setTimeout(() => this.notablesSvc.delete(event.notable.id), 900);
        }
        break;
    }
  }

}
