/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

import { Inject, Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { HatApiV2Service } from '../services/hat-api-v2.service';
import { BaseDataService } from '../services/base-data.service';
import { UserService } from '../user/user.service';

import { Profile, ProfileSharingConfig } from '../shared/interfaces/profile.interface';
import { HatRecord } from '../shared/interfaces/hat-record.interface';
import { APP_CONFIG, AppConfig } from '../app.config';
import { BundleStructure, PropertyQuery } from '../shared/interfaces/bundle.interface';

@Injectable()
export class ProfilesService extends BaseDataService<Profile> {
  private _bundle$: ReplaySubject<BundleStructure> = <ReplaySubject<BundleStructure>>new ReplaySubject(1);
  private previousBundle: BundleStructure;

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              hat: HatApiV2Service,
              userSvc: UserService) {
    super(hat, userSvc, config.name.toLowerCase(), 'profile', 'dateCreated');
  }

  get profileData$(): Observable<{ values: Profile; share: ProfileSharingConfig; }> {
    const defaultProfile: Profile = {
      dateCreated: 0,
      shared: false,
      photo: { avatar: '' },
      personal: {
        title: '', firstName: '', middleName: '', lastName: '',
        preferredName: '', nickName: '', birthDate: '', gender: '', ageGroup: ''
      },
      contact: { primaryEmail: '', alternativeEmail: '', mobile: '', landline: '' },
      emergencyContact: { firstName: '', lastName: '', mobile: '', relationship: '' },
      address: { city: '', county: '', country: '' },
      about: { title: '', body: '' },
      online: { website: '', blog: '', facebook: '', twitter: '', linkedin: '', google: '', youtube: '' }
    };

    const defaultProfileShareConfig: ProfileSharingConfig = {
      photo: { avatar: false },
      personal: {
        title: false, firstName: false, middleName: false, lastName: false,
        preferredName: false, nickName: false, birthDate: false, gender: false, ageGroup: false
      },
      contact: { primaryEmail: false, alternativeEmail: false, mobile: false, landline: false },
      emergencyContact: { firstName: false, lastName: false, mobile: false, relationship: false },
      address: { city: false, county: false, country: false },
      about: { title: false, body: false },
      online: { website: false, blog: false, facebook: false, twitter: false, linkedin: false, google: false, youtube: false }
    };

    const filteredData$ = this.data$.filter(profile => profile.length > 0);

    return Observable.zip(filteredData$, this._bundle$.asObservable())
      .map(([profiles, profileBundle]) => {
        return {
          values: this.validateProfileNewOrDefault(profiles[0].data),
          share: this.generateProfileShare(profiles[0].data, profileBundle)
        };
      })
      .startWith({ values: defaultProfile, share: defaultProfileShareConfig });
  }

  coerceType(rawProfile: HatRecord<any>): HatRecord<Profile> {
    return {
      endpoint: rawProfile.endpoint,
      recordId: rawProfile.recordId,
      data: <Profile>rawProfile.data
    };
  }

  getProfileData(): void {
    this.getInitData(1);
    this.getPhataBundle();
  }

  saveProfile(values: Profile, shares: ProfileSharingConfig): Observable<HatRecord<Profile>> {
    const permissionKey = shares.photo.avatar ? 'allow' : 'restrict';
    let filePermissionUpdate$: Observable<any>;

    if (values.photo.avatar) {
      filePermissionUpdate$ = this.hat.updateFilePermissions(values.photo.avatar.split('/').pop(), permissionKey);
    } else {
      filePermissionUpdate$ = Observable.of(null);
    }

    console.log('Saving bundle ', this.generatePhataBundle(shares));

    const phataBundleUpdate$ = this.hat.proposeNewDataBundle('phata', this.generatePhataBundle(shares));

    return Observable.forkJoin(this.save(values), filePermissionUpdate$, phataBundleUpdate$)
      .map(([savedProfile, permissionUpdateResult, bundleUpdateResult]) => this.coerceType(savedProfile));
  }

  private generateProfileShare(profile: Profile, phataBundle: BundleStructure): ProfileSharingConfig {
    let bundleMapping;

    try {
      bundleMapping = Object.keys(phataBundle.bundle.profilePublic.endpoints[0].mapping);
    } catch (e) {
      bundleMapping = [];
    }

    return <ProfileSharingConfig>Object.keys(profile).reduce((acc1, grouping) => {
      if (profile.hasOwnProperty(grouping) && typeof profile[grouping] === 'object') {
        acc1[grouping] = Object.keys(profile[grouping]).reduce((acc2, field) => {
          if (profile[grouping].hasOwnProperty(field)) {
            acc2[field] = bundleMapping.includes(`${grouping}.${field}`);
          }

          return acc2;
        }, {});
      }

      return acc1;
    }, {});
  }

  private generatePhataBundle(profile: ProfileSharingConfig): { [bundleVersion: string]: PropertyQuery } {
    const mapping = Object.keys(profile).reduce((acc, grouping) => {
      if (profile.hasOwnProperty(grouping) && typeof profile[grouping] === 'object') {
        const sharedFields = Object.keys(profile[grouping]).filter(field => profile[grouping][field] === true);
        sharedFields.forEach(field => acc[`${grouping}.${field}`] = `${grouping}.${field}`);
      }

      return acc;
    }, {});

    return {
      notables: this.previousBundle.bundle.notables,
      profile: {
        endpoints: [{
          endpoint: 'rumpelstaging/profile',
          mapping: mapping
        }],
        orderBy: 'dateCreated',
        ordering: 'descending',
        limit: 1
      }
    }
  }

  private getPhataBundle(): void {
    this.hat.getDataBundeStructure('phata').subscribe((bundle: BundleStructure) => {
      this.previousBundle = bundle;
      this._bundle$.next(bundle);
    });
  }

  private validateProfileNewOrDefault(profile: Profile): Profile {
    if (profile.photo) {
      return profile;
    } else {
      return {
        dateCreated: 0,
        shared: false,
        photo: {
          avatar: ''
        },
        personal: {
          title: '',
          firstName: '',
          middleName: '',
          lastName: '',
          preferredName: '',
          nickName: '',
          birthDate: '',
          gender: '',
          ageGroup: ''
        },
        contact: {
          primaryEmail: '',
          alternativeEmail: '',
          mobile: '',
          landline: ''
        },
        emergencyContact: {
          firstName: '',
          lastName: '',
          mobile: '',
          relationship: ''
        },
        address: {
          city: '',
          county: '',
          country: ''
        },
        about: {
          title: '',
          body: ''
        },
        online: {
          website: '',
          blog: '',
          facebook: '',
          twitter: '',
          linkedin: '',
          google: '',
          youtube: ''
        }
      };
    }
  }

}
