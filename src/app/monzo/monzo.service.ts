import { Injectable } from '@angular/core';
import { BaseDataService } from '../services/base-data.service';
import { AuthService } from '../core/services/auth.service';
import { HatApiService } from '../core/services/hat-api.service';

import { Monzo } from './monzo.interface';
import { HatRecord } from '../shared/interfaces/hat-record.interface';
import * as moment from 'moment';


@Injectable()
export class MonzoService extends BaseDataService<Monzo> {

  constructor(hat: HatApiService, authSvc: AuthService) {
    super(hat, authSvc, 'monzo', 'transactions', 'updated');
  }

  coerceType(rawMonzo: HatRecord<any>): HatRecord<Monzo> {
    const monzo: Monzo = {
      dateTime: moment(rawMonzo.data.dateTime),
      balance: rawMonzo.data.balance,
      currency: rawMonzo.data.currency,
      spend_today: rawMonzo.data.spend_today
    };

    return {
      endpoint: rawMonzo.endpoint,
      recordId: rawMonzo.recordId,
      data: monzo
    };
  }

}
