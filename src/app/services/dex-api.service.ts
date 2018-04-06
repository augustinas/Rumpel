import { Inject, Injectable } from '@angular/core';
import { HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { HttpBackendClient } from '../core/services/http-backend-client.service';
import { APP_CONFIG, AppConfig } from '../app.config';
import { Observable } from 'rxjs/Observable';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HatApiService } from '../core/services/hat-api.service';
import { DexOfferClaimRes } from '../shared/interfaces/dex-offer-claim-res.interface';
import { DataPlug } from '../shared/interfaces/data-plug.interface';

@Injectable()
export class DexApiService {
  private baseUrl: string;
  private cachedAppToken: string;
  private jwt: JwtHelperService = new JwtHelperService();

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private hat: HatApiService,
              private http: HttpBackendClient) {
    this.baseUrl = config.dex.url + config.dex.pathPrefix;
  }

  claimOffer(offerId: string): Observable<DexOfferClaimRes> {
    const url = `${this.baseUrl}/offer/${offerId}/claim`;

    return this.getApplicationToken()
      .flatMap((headers: HttpHeaders) => this.http.get<DexOfferClaimRes>(url, { headers: headers }));
  }

  getOfferClaim(offerId: string): Observable<DexOfferClaimRes> {
    const url = `${this.baseUrl}/offer/${offerId}/userClaim`;

    return this.getApplicationToken()
      .flatMap((headers: HttpHeaders) => this.http.get<DexOfferClaimRes>(url, { headers: headers }));
  }

  getAvailablePlugList(): Observable<DataPlug[]> {
    const url = `${this.config.dex.url}/api/dataplugs`;

    return this.http.get<{ plug: DataPlug; }[]>(url)
      .map(resBody => {
        return resBody
          .filter(dataplug => 'location,facebook,twitter,fitbit,calendar'.includes(dataplug.plug.name.toLowerCase()))
          .map(dataplug => {
            dataplug.plug.active = false;

            return dataplug.plug;
          });
      });
  }

  private getApplicationToken(): Observable<HttpHeaders> {
    if (this.cachedAppToken && !this.jwt.isTokenExpired(this.cachedAppToken, 30)) {
      const headers = new HttpHeaders()
        .set('X-Auth-Token', this.cachedAppToken)
        .set('Content-Type', 'application/json');

      return Observable.of(headers);
    } else {
      return this.hat.getApplicationToken(this.config.dex.name, this.config.dex.url)
        .do(token => this.cachedAppToken = token)
        .map(token => new HttpHeaders({ 'X-Auth-Token': token }));
    }
  }

  // TODO: find a better place for this method
  tickleNotables(hatDomain: string): void {
    const queryParams = new HttpParams()
      .set('phata', hatDomain);

    this.http.get(this.config.notables.url, { params: queryParams, observe: 'response' })
      .subscribe((res: HttpResponse<any>) => {
        console.log(`Notables service tickled with ${res.status} response`);
      });
  }
}
