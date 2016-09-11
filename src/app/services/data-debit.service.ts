import { Injectable } from '@angular/core';
import { HatApiService } from './hat-api.service';
import { MarketSquareService } from './market-square.service';
import { Observable, Observer } from 'rxjs/Rx';

@Injectable()
export class DataDebitService {

  constructor(private _hatSvc: HatApiService,
              private _marketSvc: MarketSquareService) {}

  loadOffer(uuid: string): Observable<any> {
    console.log('UUID', uuid);
    return Observable.forkJoin(
      this._marketSvc.getOffer()
        .map(marketOffers => marketOffers.find(offerItem => offerItem.offer.uuid === uuid))
    );
  }

  loadDataDebit(uuid: string) {
    return this._hatSvc.getDataDebit(uuid);
  }

  loadAllDataDebits() {
    return this._hatSvc.getAllDataDebits();
  }

}
