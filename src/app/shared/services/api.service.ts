import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3030/api/images'; // Update with your API URL

  constructor(private http: HttpClient) { }

  uploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getImages(cursor?: string | null, limit: number = 10, search?: string): Observable<any> {
    let params: any = { limit };
    if (cursor) params.cursor = cursor;
    if (search) params.search = search;

    return this.http.get(`${this.apiUrl}`, { params });
  }

  getImageUrl(fileId: string): string {
    return `${this.apiUrl}/${fileId}`;
  }
  downloadImage(fileId: string): Observable<Blob> {
    return this.http.get(this.getImageUrl(fileId), {
      responseType: 'blob'
    });
  }
}
