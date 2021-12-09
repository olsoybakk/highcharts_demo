import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  getData(url: string) {
    return this.http.get<any>(url, { headers: { mode: 'no-cors', 'Access-Control-Allow-Origin': '*' } }).pipe(
      catchError(() => {
        return of(null);
      }),
      map(result => {
        return result;
      })
    );
  }
}
