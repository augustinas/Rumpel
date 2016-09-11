import * as moment from 'moment';

export interface DataDebit {
  dateCreated: any;
  lastUpdated: any;
  startDate: any;
  endDate: any;
  name: string;
  price: number;
  rolling: boolean;
  sell: boolean;
  key: string;
  dataToShare: any;
}