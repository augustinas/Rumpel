/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TreeViewComponent } from './components';
import { OutsideClickDirective, StickDirective } from './directives';
import { MomentPipe, FilterByPipe, WithObjectPipe, TimeFilterPipe, LimitContentPipe, ReplaceCharsPipe, RemoveCharsPipe, RelativeTimePipe,
         MarkdownToHtmlPipe, LimitMembersPipe, RelativeTimesFilterPipe, SafeHtmlPipe } from './pipes';
import { TimeFilterTwoPipe } from './pipes/time-filter-two.pipe';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { NotableComponent } from './components/notable/notable.component';
import { LocationNotableComponent } from './components/location-notable/location-notable.component';
import { PresignImgUrlPipe } from './pipes/presign-img-url.pipe';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { UnbundlePipe } from './pipes/unbundle.pipe';
import { SheFeedItemComponent } from './components/she-feed-item/she-feed-item.component';
import { CustomAngularMaterialModule } from '../core/custom-angular-material.module';
import { DatetimePipe } from './pipes/datetime.pipe';

@NgModule({
  imports: [ CommonModule, FormsModule, CustomAngularMaterialModule ],

  declarations: [ MomentPipe, FilterByPipe, WithObjectPipe, RelativeTimePipe, MarkdownToHtmlPipe,
                  ReplaceCharsPipe, RemoveCharsPipe, LimitContentPipe, LimitMembersPipe, RelativeTimesFilterPipe,
                  TimeFilterPipe, TimeFilterTwoPipe, SafeHtmlPipe,
                  OutsideClickDirective, StickDirective,
                  TreeViewComponent, SpinnerComponent,
                  NotableComponent, LocationNotableComponent, PresignImgUrlPipe,
                  PageHeaderComponent,
                  UnbundlePipe,
                  SheFeedItemComponent,
                  DatetimePipe ],

  exports: [ MomentPipe, FilterByPipe, WithObjectPipe, RelativeTimePipe, MarkdownToHtmlPipe,
             ReplaceCharsPipe, RemoveCharsPipe, LimitContentPipe, LimitMembersPipe, RelativeTimesFilterPipe,
             TimeFilterPipe, TimeFilterTwoPipe, SafeHtmlPipe, DatetimePipe,
             TreeViewComponent,
             OutsideClickDirective, StickDirective, SpinnerComponent,
             CommonModule, RouterModule, NotableComponent, LocationNotableComponent, PresignImgUrlPipe, PageHeaderComponent,
             UnbundlePipe, SheFeedItemComponent ]
})
export class SharedModule {}
