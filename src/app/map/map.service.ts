import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class MapService {

  constructor(private http: HttpClient) { }

  getData(url: string) {
    // return this.http.get<any>(url, { headers: { mode: 'no-cors', 'Access-Control-Allow-Origin': '*' } }).pipe(
    return this.http.get<any>(url).pipe(
      catchError(() => {
        return of(null);
      }),
      map(result => {
        return result;
      })
    );
  }

}
