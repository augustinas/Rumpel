import { Component, OnInit } from '@angular/core';
import { SheFeedService } from '../she-feed.service';
import { Observable } from 'rxjs/Observable';
import { HatRecord } from '../../shared/interfaces/hat-record.interface';
import { SheFeed } from '../she-feed.interface';
import { Moment } from 'moment';
import * as moment from 'moment';
import { Filter } from '../../shared/interfaces/bundle.interface';
import { MatRadioChange } from '@angular/material/radio';

@Component({
  selector: 'rum-she-feed',
  templateUrl: './she-feed.component.html',
  styleUrls: ['./she-feed.component.scss']
})
export class SheFeedComponent implements OnInit {
  public feed$: Observable<HatRecord<SheFeed>[]>;

  constructor(private sheFeedSvc: SheFeedService) { }

  ngOnInit() {
    this.feed$ = this.sheFeedSvc.data$;

    this.sheFeedSvc.getInitData(1000);
  }

  convertUnixTimestampToMoment(timestamp: number): Moment {
    return moment.unix(timestamp);
  }

  applyFilter(change: MatRadioChange) {
    if (change.value === 'all') {
      this.sheFeedSvc.clearData();
      this.sheFeedSvc.getInitData(1000);
    } else {
      this.sheFeedSvc.getTimeIntervalData(this.generateTimeFilter(change.value));
    }
  }

  private generateTimeFilter(filter: string): Filter[] {
    let startTime: number;
    let endTime: number;

    if (filter === 'past') {
      startTime = 1;
      endTime = moment().unix();
    } else {
      startTime = moment().unix();
      endTime = moment().add(5, 'years').unix();
    }

    return [{
      field: 'date.unix',
      operator: {
        operator: 'between',
        lower: startTime,
        upper: endTime
      }
    }];
  }

}