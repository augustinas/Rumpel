import { Injectable } from '@angular/core';
import { Http, Headers, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { DataDebit } from '../shared/interfaces';
import * as moment from 'moment';

const HAT_PORT = 8080;

@Injectable()
export class HatApiService {
  private _token: string;
  private _domain: string;
  private _baseUrl: string;
  private _headers: Headers;

  constructor(private _http: Http) {}

  getUrl() {
    return this._baseUrl;
  }

  getDomain() {
    return this._domain;
  }

  updateCredentials(domain: string, token: string) {
    this._baseUrl = 'https://' + domain;
    this._domain = domain;
    this._token = token;
    this._headers = new Headers();
    this._headers.append('Content-Type', 'application/json');
    // this._headers.append('Accept', 'application/json');
    this._headers.append('X-Auth-Token', this._token);
  }

  validateToken(domain: string, token: string) {
    this.updateCredentials(domain, token);

    const url = this._baseUrl + '/users/access_token/validate';

    return this._http.get(url, { headers: this._headers, body: '' }).map(res => res.json());
  }

  getDataSources(): Observable<any> {
    const url = this._baseUrl + '/data/sources';

    return this._http.get(url, { headers: this._headers, body: '' })
      .map(res => res.json());
  }

  getAllValuesOf(name: string, source: string): Observable<any> {
    return this.getTable(name, source)
      .flatMap(table => {
        if (table === "Not Found") {
          return Observable.of([]);
        } else {
          return this.getValues(table.id);
        }
      });
  }

  getTable(name: string, source: string): Observable<any> {
    const url = this._baseUrl + '/data/table';
    let query: URLSearchParams = new URLSearchParams();
    query.append('name', name);
    query.append('source', source);

    console.log('Getting table values: ', name, source);

    return this._http.get(url, { headers: this._headers, search: query, body: '' })
      .map(res => res.json())
      .catch(e => {
        if (e.status === 404) return Observable.of("Not Found");
      });
  }

  getModel(tableId: number): Observable<any> {
    const url = this._baseUrl + '/data/table/' + tableId;

    return this._http.get(url, { headers: this._headers, body: '' })
      .map(res => res.json());
  }

  getModelMapping(tableId: number): Observable<any> {
    return this.getModel(tableId)
      .map(rawModel => this.mapDataSource(rawModel, rawModel.name));
  }

  postModel(model: any): Observable<any> {
    const url = this._baseUrl + '/data/table';

    return this._http.post(url, model, { headers: this._headers })
      .map(res => res.json())
      .map(rawModel => this.mapDataSource(rawModel, rawModel.name));
  }

  postRecord(obj: any, hatIdMapping: any, prefix: string = 'default'): Observable<any> {
    const url = this._baseUrl + '/data/record/values';
    const hatFormattedObj = this.createRecord(obj, hatIdMapping, prefix);

    return this._http.post(url, hatFormattedObj, { headers: this._headers });
  }

  getValues(tableId: number): Observable<any> {
    const url = this._baseUrl + '/data/table/' + tableId + '/values';

    let query: URLSearchParams = new URLSearchParams();
    query.append('starttime', '0');

    return this._http.get(url, { headers: this._headers , search: query, body: '' })
      .map(res => res.json())
      .map(body => this.transformRecord(body));
  }

  getDataDebit(uuid: string) {
    const url = this._baseUrl + '/dataDebit/' + uuid + '/values?limit=0&starttime=0';
    return this._http.get(url, { headers: this._headers, body: '' })
      .map(res => res.json())
      .map(debit => this.transformDataDebit(debit));
  }

  getAllDataDebits() {
    const url = this._baseUrl + '/dataDebit';
    return this._http.get(url, { headers: this._headers, body: '' })
      .map(res => res.json());
  }

  updateDataDebit(uuid: string, state: string): Observable<any> {
    const url = this._baseUrl + '/directDebit/' + uuid + '/' + state;

    return this._http.put(url, {}, { headers: this._headers });
  }

  private createRecord(obj: any, hatIdMapping: any, prefix: string) {
    if (Array.isArray(obj)) {
      return obj.map(record => {
        return {
          record: { name: new Date() },
          values: this.createValue(record, hatIdMapping, prefix)
        }
      });
    } else {
      return [{
        record: { name: new Date() },
        values: this.createValue(obj, hatIdMapping, prefix)
      }]
    }
  }

  private createValue(obj: any, hatIdMapping: any, prefix: string = 'default') {
    return Object.keys(obj).reduce((acc, key) => {
      if (typeof obj[key] === 'object') {
        const subTreeValues = this.createValue(obj[key], hatIdMapping, prefix + '_' + key);
        acc = acc.concat(subTreeValues);
      } else {
        acc.push({
          value: '' + obj[key],
          field: {
            id: hatIdMapping[prefix + '_' + key],
            name: key
          }
        });
      }

      return acc;
    }, []);
  }

  private mapDataSource(table: any, prefix: string = 'default') {
    var mapping = {};

    table.fields.reduce((acc, field) => {
      acc[prefix + '_' + field.name] = field.id;
      return acc;
    }, mapping);

    if (table.subTables) {
      const mappedSubTables = table.subTables.reduce((acc, table) => {
        const mappedTable = this.mapDataSource(table, prefix + '_' + table.name);
        Object.assign(acc, mappedTable);
        return acc;
      }, mapping);
    }

    return mapping;
  }

  private transformDataDebit(rawDebit) {
    let dataGroups = rawDebit.bundleContextless.dataGroups;

    let dataGroupsNames = Object.keys(dataGroups);

    let mappedDataGroups = dataGroupsNames.map(groupName => {
      return {
        name: groupName,
        data: dataGroups[groupName].map(group => {
          return {
            name: group.name,
            data: this.transformRecord(group.data)
          }
        })
      }
    });

    let processedDebit: DataDebit = {
      dateCreated: moment(rawDebit.dateCreated),
      startDate: moment(rawDebit.startDate),
      endDate: moment(rawDebit.endDate),
      lastUpdated: moment(rawDebit.lastUpdated),
      name: rawDebit.name,
      price: rawDebit.price,
      rolling: rawDebit.rolling,
      sell: rawDebit.sell,
      key: rawDebit.key,
      dataToShare: mappedDataGroups
    };

    return processedDebit;
  }

  private transformRecord(raw: Array<any>) {
    return raw.map((record) => {
      return this.processNode(record.tables[0]);
    });
  }

  private processNode(node) {
    var values = {};
    node.fields.reduce((acc, field) => {
      if (field.values) {
        acc[field.name] = field.values[0].value;
      } else {
        acc[field.name] = null;
      }
      return acc;
    }, values);

    if (node.subTables) {
      node.subTables.reduce((acc, table) => {
        acc[table.name] = this.processNode(table);

        return acc;
      }, values);
    }

    return values;
  }
}
