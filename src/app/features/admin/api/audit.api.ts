import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditLogEntryDto } from './audit.dto';

@Injectable({ providedIn: 'root' })
export class AuditApi {
  private readonly http = inject(HttpClient);

  getAuditLog(limit = 50): Observable<AuditLogEntryDto[]> {
    return this.http.get<AuditLogEntryDto[]>(`${environment.apiBaseUrl}/admin/audit-log`, {
      params: { limit: String(limit) },
    });
  }
}
