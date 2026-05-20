import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { StayOption } from '../../../stays/model/stay-search.model';
import { StaysFacade } from '../../../stays/services/stays.facade';
import { HotelGallery } from '../../components/hotel-gallery/hotel-gallery';
import { HotelHero } from '../../components/hotel-hero/hotel-hero';
import { HotelHighlights } from '../../components/hotel-highlights/hotel-highlights';
import { HotelInlineSearchCard } from '../../components/hotel-inline-search-card/hotel-inline-search-card';
import { HotelLocation } from '../../components/hotel-location/hotel-location';
import { HotelPolicies } from '../../components/hotel-policies/hotel-policies';
import { HotelRoomsCarousel } from '../../components/hotel-rooms-carousel/hotel-rooms-carousel';
import { HotelServicesList } from '../../components/hotel-services-list/hotel-services-list';
import { HotelStats } from '../../components/hotel-stats/hotel-stats';
import { Hotel, HotelServiceOffering } from '../../model/hotel.model';
import { HotelsFacade } from '../../services/hotels.facade';

@Component({
  selector: 'app-hotel-detail-page',
  imports: [
    ErrorMessage,
    LoadingState,
    HotelHero,
    HotelStats,
    HotelHighlights,
    HotelInlineSearchCard,
    HotelRoomsCarousel,
    HotelGallery,
    HotelServicesList,
    HotelLocation,
    HotelPolicies,
  ],
  templateUrl: './hotel-detail-page.html',
  styleUrl: './hotel-detail-page.scss',
})
export class HotelDetailPage {
  private readonly hotelsFacade = inject(HotelsFacade);
  private readonly staysFacade = inject(StaysFacade);
  private readonly route = inject(ActivatedRoute);

  protected readonly hotel = signal<Hotel | null>(null);
  protected readonly services = signal<HotelServiceOffering[]>([]);
  protected readonly rooms = signal<StayOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);

  /** Default dates used to preview rooms in the carousel: today / tomorrow / 1 adult. */
  private readonly roomsPreviewCheckIn = isoDateOffset(0);
  private readonly roomsPreviewCheckOut = isoDateOffset(1);

  /** Lowest nightly price across loaded rooms — feeds the search card hint. */
  protected readonly minRoomPrice = computed<{ amount: number; currency: string } | null>(() => {
    const list = this.rooms();
    if (list.length === 0) return null;
    let cheapest = list[0];
    for (const r of list) {
      if (r.nightlyPrice < cheapest.nightlyPrice) cheapest = r;
    }
    return { amount: cheapest.nightlyPrice, currency: cheapest.currency };
  });

  protected readonly searchQueryParams = computed<Params>(() => {
    const h = this.hotel();
    return h ? { hotelId: h.hotelId, destination: h.city } : {};
  });

  constructor() {
    const hotelId = Number(this.route.snapshot.paramMap.get('hotelId'));
    if (Number.isFinite(hotelId) && hotelId > 0) {
      this.loadHotel(hotelId);
    } else {
      this.problem.set({ title: 'Invalid hotel id', detail: 'The requested hotel id is not valid.' });
    }
  }

  private loadHotel(hotelId: number): void {
    this.problem.set(null);
    this.loading.set(true);

    forkJoin({
      hotel: this.hotelsFacade.getHotelDetails(hotelId),
      services: this.hotelsFacade.getHotelServices(hotelId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ hotel, services }) => {
          this.hotel.set(hotel);
          this.services.set(services);
          this.loadRoomsPreview(hotelId, hotel.city);
        },
        error: (error: unknown) => {
          this.hotel.set(null);
          this.services.set([]);
          this.problem.set(toProblemDetail(error));
        },
      });
  }

  /**
   * Preview the room types in this hotel via the existing search endpoint
   * with sensible defaults. Soft-fails: on error or 0 results, the Rooms section
   * (and its anchor) simply doesn't render.
   */
  private loadRoomsPreview(hotelId: number, city: string): void {
    this.staysFacade
      .search({
        destination: city,
        hotelId,
        checkIn: this.roomsPreviewCheckIn,
        checkOut: this.roomsPreviewCheckOut,
        adults: 1,
        childrenAges: [],
        pets: [],
      })
      .subscribe({
        next: (results) => this.rooms.set(results.filter((r) => r.hotelId === hotelId)),
        error: () => this.rooms.set([]),
      });
  }
}

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
