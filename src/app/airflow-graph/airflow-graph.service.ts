import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Interface goes here — no decorators allowed
export interface Dag {
  dag_id: string;
  dag_display_name: string;
  // Add more if needed
}

@Injectable({
  providedIn: 'root'
})
export class AirflowGraphService {

  private baseUrl = 'http://localhost:8000/api'; // Backend base

  constructor(private http: HttpClient) {}

  getDags(): Observable<{ dags: Dag[] }> {
    return this.http.get<{ dags: Dag[] }>(`${this.baseUrl}/dags`);
  }

  getDagTasks(dagId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/dags/${dagId}/tasks`);
  }
}