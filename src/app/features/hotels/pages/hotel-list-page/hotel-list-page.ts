import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);

  protected readonly hotels = signal<Hotel[]>([]);
  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly cityFilter = signal('');

  protected readonly PAGE_SIZE = 15;
  protected readonly currentPage = signal(1);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.hotels().length / this.PAGE_SIZE)),
  );
  protected readonly pagedHotels = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.hotels().slice(start, start + this.PAGE_SIZE);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const city = params.get('city')?.trim() ?? '';
      this.cityFilter.set(city);
      this.loadHotels(city);
    });
  }

  protected emptyMessage(): string {
    const city = this.cityFilter();
    return city ? `No hotels are currently available in ${city}.` : 'No hotels are currently available.';
  }

  private loadHotels(city: string): void {
    this.problem.set(null);
    this.currentPage.set(1);

    // Skip the loading spinner when the result is already in cache
    if (!this.hotelsFacade.hasHotelsCache(city)) {
      this.loading.set(true);
    }

    this.hotelsFacade
      .listHotels(city ? { city } : {})
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
