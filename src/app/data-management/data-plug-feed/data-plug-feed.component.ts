import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SheFeedService } from '../../dashboard/she-feed.service';
import { Observable } from 'rxjs/Observable';
import { HatRecord } from '../../shared/interfaces/hat-record.interface';
import { SheFeed } from '../../dashboard/she-feed.interface';

@Component({
  selector: 'rum-data-plug-feed',
  templateUrl: './data-plug-feed.component.html',
  styleUrls: ['./data-plug-feed.component.scss']
})
export class DataPlugFeedComponent implements OnInit {
  public feed$: Observable<HatRecord<SheFeed>[]>;

  constructor(private route: ActivatedRoute,
              private sheSvc: SheFeedService) { }

  ngOnInit() {
    this.feed$ = this.route.parent.params.flatMap(routeParams => {
      return this.sheSvc.filteredBy$(routeParams['provider'].replace('calendar', 'google') || '');
    });

    this.sheSvc.getInitData(1000);
  }

}
