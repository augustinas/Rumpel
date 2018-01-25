/*
 * Copyright (C) 2017 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 7, 2017
 */

import { Inject, Injectable } from '@angular/core';
import { Headers, Http, Response, URLSearchParams } from '@angular/http';
import { AuthHttp } from './auth-http.service';
import { Observable } from 'rxjs/Observable';
import { APP_CONFIG, AppConfig } from '../app.config';

import { User } from '../user/user.interface';
import { HatRecord } from '../shared/interfaces/hat-record.interface';
import { DataDebit, DataDebitValues } from '../shared/interfaces/data-debit.interface';
import { FileMetadataReq, FileMetadataRes } from '../shared/interfaces/file.interface';
import { BundleStructure, BundleValues, EndpointQuery, PropertyQuery } from '../shared/interfaces/bundle.interface';

@Injectable()
export class HatApiV2Service {
  private pathPrefix = '/api/v2';
  private appNamespace: string;

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private authHttp: AuthHttp,
              private http: Http) {
    this.appNamespace = config.name.toLowerCase();
  }

  login(username: string, password: string): Observable<User> {
    const path = `/users/access_token`;
    const headers = new Headers({
      username: encodeURIComponent(username),
      password: encodeURIComponent(password)
    });

    return this.http.get(path, { headers: headers })
      .map((res: Response) => {
        const token = res.json().accessToken;

        return this.loginWithToken(token);
      });
  }

  loginWithToken(token: string): User {
    return this.authHttp.setToken(token);
  }

  hatLogin(name: string, redirect: string): Observable<string> {
    const path = `/control/v2/auth/hatlogin`;
    const queryParams = new URLSearchParams();
    queryParams.append('name', name);
    queryParams.append('redirect', redirect);

    return this.authHttp.get(path, { search: queryParams })
      .map((res: Response) => res.json().message);
  }

  recoverPassword(body: { email: string; }): Observable<any> {
    const path = `/control/v2/auth/passwordReset`;
    const headers = new Headers({ 'Content-Type': 'application/json' });

    return this.http.post(path, body, { headers: headers })
      .map((res: Response) => res.json());
  }

  changePassword(body: { password: string; newPassword: string; }): Observable<any> {
    const path = `/control/v2/auth/password`;
    const headers = new Headers({ 'Content-Type': 'application/json' });

    return this.authHttp.post(path, body, { headers: headers })
      .map((res: Response) => res.json());
  }

  resetPassword(resetToken: string, body: { newPassword: string; }): Observable<any> {
    const path = `/control/v2/auth/passwordreset/confirm/${resetToken}`;
    const headers = new Headers({ 'Content-Type': 'application/json' });

    return this.http.post(path, body, { headers: headers })
      .map((res: Response) => res.json());
  }

  getApplicationToken(name: string, resource: string): Observable<string> {
    const path = `/users/application_token`;
    const queryParams = new URLSearchParams();
    queryParams.append('name', name);
    queryParams.append('resource', resource);

    return this.authHttp.get(path, { search: queryParams })
      .map((res: Response) => res.json().accessToken)
  }

  getDataRecords(namespace: string, endpoint: string, take?: number, orderBy?: string, drop?: number): Observable<HatRecord<any>[]> {
    const path = `${this.pathPrefix}/data/${namespace}/${endpoint}`;
    const queryParams = new URLSearchParams();

    queryParams.append('ordering', 'descending');

    if (take) {
      queryParams.append('take', take.toString());
    }

    if (orderBy) {
      queryParams.append('orderBy', orderBy);
    }

    if (drop) {
      queryParams.append('skip', drop.toString());
    }

    return this.authHttp.get(path, { search: queryParams }).map((res: Response) => <HatRecord<any>[]>res.json());
  }

  createRecord(namespace: string, endpoint: string, record: any): Observable<HatRecord<any>> {
    const path = `${this.pathPrefix}/data/${namespace}/${endpoint}`;

    return this.authHttp.post(path, record).map((res: Response) => <HatRecord<any>>res.json());
  }

  updateRecord(hatRecord: HatRecord<any>): Observable<HatRecord<any>> {
    const path = `${this.pathPrefix}/data`;

    return this.authHttp.put(path, [hatRecord]).map((res: Response) => <HatRecord<any>>res.json())
  }

  deleteRecords(recordIds: Array<string>): Observable<number> {
    const path = `${this.pathPrefix}/data`;

    if (recordIds.length > 0) {
      const queryParams = new URLSearchParams();
      recordIds.forEach(recordId => queryParams.append('records', recordId));

      return this.authHttp.delete(path, { search: queryParams }).map((res: Response) => res.status);
    } else {
      return Observable.throw(new Error('Cannot delete. Record IDs missing.'));
    }
  }

  getCombinatorRecords(name: string, orderBy: string, take: number): Observable<HatRecord<any>[]> {
    const path = `${this.pathPrefix}/combinator/${name}`;

    const queryParams = new URLSearchParams();
    queryParams.append('orderBy', orderBy);
    queryParams.append('take', take.toString());
    queryParams.append('ordering', 'descending');

    return this.authHttp.get(path, { search: queryParams }).map((res: Response) => <HatRecord<any>[]>res.json());
  }

  proposeNewDataEndpoint(name: string, proposedCombinator: EndpointQuery[]): Observable<number> {
    const path = `${this.pathPrefix}/combinator/${name}`;

    return this.authHttp.post(path, proposedCombinator).map((res: Response) => res.status);
  }

  getDataBundle(bundleId: string): Observable<any> {
    const path = `${this.pathPrefix}/data-bundle/${bundleId}`;

    return this.authHttp.get(path).map((res: Response) => res.json());
  }

  getDataBundeStructure(bundleId: string): Observable<BundleStructure> {
    const path = `${this.pathPrefix}/data-bundle/${bundleId}/structure`;

    return this.authHttp.get(path).map((res: Response) => <BundleStructure>res.json());
  }

  proposeNewDataBundle(bundleId: string, bundle: { [bundleVersion: string]: PropertyQuery }): Observable<BundleValues> {
    const path = `${this.pathPrefix}/data-bundle/${bundleId}`;

    return this.authHttp.post(path, bundle).map((res: Response) => <BundleValues>res.json());
  }

  getAllDataDebits(): Observable<DataDebit[]> {
    const path = `${this.pathPrefix}/data-debit`;

    return this.authHttp.get(path).map((res: Response) => <DataDebit[]>res.json());
  }

  getDataDebit(debitId: string): Observable<DataDebit> {
    const path = `${this.pathPrefix}/data-debit/${debitId}`;

    return this.authHttp.get(path).map((res: Response) => <DataDebit>res.json());
  }

  getDataDebitValues(debitId: string): Observable<DataDebitValues> {
    const path = `${this.pathPrefix}/data-debit/${debitId}/values`;

    return this.authHttp.get(path).map((res: Response) => <DataDebitValues>res.json());
  }

  updateDataDebit(debitId: string, action: string): Observable<DataDebit> {
    const path = `${this.pathPrefix}/data-debit/${debitId}/${action}`;

    return this.authHttp.get(path).map((res: Response) => <DataDebit>res.json());
  }

  getFileMetadata(fileId: string): Observable<FileMetadataRes> {
    const path = `${this.pathPrefix}/files/file/${fileId}`;

    return this.authHttp.get(path).map((res: Response) => <FileMetadataRes>res.json());
  }

  uploadFile(file: ArrayBuffer, metadata: FileMetadataReq, contentType?: string): Observable<FileMetadataRes> {
    const headers = new Headers({
      'x-amz-server-side-encryption': 'AES256',
      'Content-Type': contentType || 'image/png'
    });

    return this.uploadFileMetadata(metadata)
      .flatMap(uploadedMetadata => {
        return this.http.put(uploadedMetadata.contentUrl, file, { headers: headers })
          .map((res: Response) => uploadedMetadata)
      })
      .flatMap(uploadedMetadata => this.markFileAsComplete(uploadedMetadata.fileId));
  }

  deleteFile(fileId: string): Observable<number> {
    const path = `${this.pathPrefix}/files/file/${fileId}`;

    return this.authHttp.delete(path).map((res: Response) => res.status);
  }

  updateFilePermissions(fileId: string, permission: string, userId?: string): Observable<number> {
    let actionIdentifier;
    switch (permission) {
      case 'allow':
        actionIdentifier = 'allowAccessPublic';
        break;
      case 'restrict':
        actionIdentifier = 'restrictAccessPublic';
        break;
      default:
        return Observable.throw(new Error('Requested permission cannot be matched to available options.'))
    }

    const path = `${this.pathPrefix}/files/${actionIdentifier}/${fileId}`;

    return this.authHttp.get(path).map((res: Response) => res.status);
  }

  private uploadFileMetadata(metadata: FileMetadataReq): Observable<FileMetadataRes> {
    const path = `${this.pathPrefix}/files/upload`;

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.authHttp.post(path, metadata, { headers: headers })
      .map((res: Response) => <FileMetadataRes>res.json());
  }

  getPhataPage(): Observable<BundleValues> {
    const path = `${this.pathPrefix}/phata/profile`;

    return this.http.get(path).map((res: Response) => res.json());
  }

  private markFileAsComplete(fileId: string): Observable<FileMetadataRes> {
    const path = `${this.pathPrefix}/files/file/${fileId}/complete`;

    return this.authHttp.put(path, {}).map((res: Response) => <FileMetadataRes>res.json());
  }

}
