/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LocationsModule } from '../locations/locations.module';
import { SharedModule } from '../shared/shared.module';

import { MyDayComponent } from './my-day/my-day.component';
import { ActivityListComponent } from './activity-list/activity-list.component';
import { CustomAngularMaterialModule } from '../core/custom-angular-material.module';

@NgModule({
  imports: [
    SharedModule,
    LocationsModule,
    FormsModule,
    CustomAngularMaterialModule
  ],
  declarations: [
    MyDayComponent,
    ActivityListComponent
  ]
})
export class MashupsModule {}
