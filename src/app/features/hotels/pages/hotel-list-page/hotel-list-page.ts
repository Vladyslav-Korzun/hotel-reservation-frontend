import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { HotelCard } from '../../components/hotel-card/hotel-card';
import { Hotel } from '../../model/hotel.model';
import { HotelsFacade } from '../../services/hotels.facade';

@Component({
  selector: 'app-hotel-list-page',
  imports: [ErrorMessage, HotelCard, LoadingState],
  templateUrl: './hotel-list-page.html',
  styleUrl: './hotel-list-page.scss',
})
export class HotelListPage {
  private readonly hotelsFacade = inject(HotelsFacade);

  protected readonly hotels = signal<Hotel[]>([]);
  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);

  constructor() {
    this.loadHotels();
  }

  private loadHotels(): void {
    this.problem.set(null);
    this.loading.set(true);

    this.hotelsFacade
      .listHotels()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (hotels) => this.hotels.set(hotels),
        error: (error: unknown) => {
          this.hotels.set([]);
          this.problem.set(toProblemDetail(error));
        },
      });
  }
}
