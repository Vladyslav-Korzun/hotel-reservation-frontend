import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { roomPhotoUrl } from '../../../../shared/assets/placeholder-images';
import { AuthService } from '../../../../core/auth/auth.service';
import { formatAccommodationPartySummary } from '../../../../shared/accommodation/accommodation-party-presenter.util';
import {
  accommodationPartyToQueryParams,
  readAccommodationPartyFromQuery,
} from '../../../../shared/accommodation/accommodation-party-query.util';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { toDisplayDate } from '../../../../shared/date/display-date.util';
import { ErrorMessage } from '../../../../shared/ui/error-message/error-message';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { Hotel } from '../../../hotels/model/hotel.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { StaySearchForm } from '../../components/stay-search-form/stay-search-form';
import { StayOption, StaySearchCriteria } from '../../model/stay-search.model';
import { StaysFacade } from '../../services/stays.facade';

@Component({
  selector: 'app-stay-search-page',
  imports: [RouterLink, StaySearchForm, ErrorMessage, LoadingState, CurrencyPipe],
  templateUrl: './stay-search-page.html',
  styleUrl: './stay-search-page.scss',
})
export class StaySearchPage {
  private readonly auth = inject(AuthService);
  private readonly stays = inject(StaysFacade);
  private readonly hotelsFacade = inject(HotelsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly criteria = signal<StaySearchCriteria>(readCriteria(this.route));
  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly results = signal<StayOption[]>([]);
  private readonly hotelsById = signal<ReadonlyMap<number, Hotel>>(new Map());
  protected readonly sortMode = signal<'price-asc' | 'price-desc' | 'availability'>('price-asc');
  protected readonly petsOnly = signal(false);
  protected readonly canCustomerBook = computed(() => !this.auth.isAuthenticated() || this.auth.hasAnyRole(['GUEST']));
  protected readonly displayResults = computed(() => {
    let items = this.results();
    if (this.petsOnly()) items = items.filter((r) => r.petsAllowed);
    const sort = this.sortMode();
    if (sort === 'price-asc') return [...items].sort((a, b) => a.nightlyPrice - b.nightlyPrice);
    if (sort === 'price-desc') return [...items].sort((a, b) => b.nightlyPrice - a.nightlyPrice);
    return [...items].sort((a, b) => b.availableCount - a.availableCount);
  });

  protected readonly PAGE_SIZE = 15;
  protected readonly currentPage = signal(1);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.displayResults().length / this.PAGE_SIZE)),
  );
  protected readonly pagedResults = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.displayResults().slice(start, start + this.PAGE_SIZE);
  });

  constructor() {
    this.loadResults(this.criteria());
    this.loadHotelsLookup();
  }

  protected hotelCityLabel(option: StayOption): string {
    const hotel = this.hotelsById().get(option.hotelId);
    if (!hotel) return option.hotelName;
    return `${hotel.city}, ${hotel.country}`;
  }

  protected setSortMode(mode: 'price-asc' | 'price-desc' | 'availability'): void {
    this.sortMode.set(mode);
    this.currentPage.set(1);
  }

  protected togglePetsOnly(): void {
    this.petsOnly.update(v => !v);
    this.currentPage.set(1);
  }

  private loadHotelsLookup(): void {
    this.hotelsFacade
      .listHotels()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (hotels) => {
          const map = new Map<number, Hotel>();
          for (const h of hotels) map.set(h.hotelId, h);
          this.hotelsById.set(map);
        },
        error: () => this.hotelsById.set(new Map()),
      });
  }

  protected search(criteria: StaySearchCriteria): void {
    this.criteria.set(criteria);
    this.loadResults(criteria);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        destination: criteria.destination || null,
        hotelId: criteria.hotelId || null,
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        ...accommodationPartyToQueryParams(criteria),
      },
    });
  }

  protected partySummary(criteria: StaySearchCriteria): string {
    return formatAccommodationPartySummary(criteria);
  }

  protected reservationParams(option: StayOption): Record<string, string | number> {
    const criteria = this.criteria();

    return {
      hotelId: option.hotelId,
      hotelName: option.hotelName,
      roomTypeId: option.roomTypeId,
      roomName: option.roomName,
      location: criteria?.destination ?? '',
      checkIn: criteria?.checkIn ?? '',
      checkOut: criteria?.checkOut ?? '',
      nightlyPrice: option.nightlyPrice,
      currency: option.currency,
      maxAdults: option.maxAdults,
      maxChildren: option.maxChildren,
      maxInfants: option.maxInfants,
      maxTotalGuests: option.maxTotalGuests,
      petsAllowed: String(option.petsAllowed),
      maxPets: option.maxPets,
      ...(criteria ? accommodationPartyToQueryParams(criteria) : accommodationPartyToQueryParams({ adults: 1, childrenAges: [], pets: [] })),
    };
  }

  protected roomDetailsLink(option: StayOption): string[] {
    return ['/stays', String(option.hotelId), 'rooms', String(option.roomTypeId)];
  }

  protected roomDetailsQueryParams(option: StayOption): Record<string, string | number> {
    const criteria = this.criteria();
    const base: Record<string, string | number> = {
      hotelName: option.hotelName,
      roomName: option.roomName,
      location: criteria?.destination ?? '',
      checkIn: criteria?.checkIn ?? '',
      checkOut: criteria?.checkOut ?? '',
      ...(criteria ? accommodationPartyToQueryParams(criteria) : accommodationPartyToQueryParams({ adults: 1, childrenAges: [], pets: [] })),
      maxAdults: option.maxAdults,
      maxChildren: option.maxChildren,
      maxInfants: option.maxInfants,
      maxTotalGuests: option.maxTotalGuests,
      petsAllowed: option.petsAllowed ? 'true' : 'false',
      maxPets: option.maxPets,
      availableCount: option.availableCount,
      nightlyPrice: option.nightlyPrice,
      currency: option.currency,
    };

    if (option.bedSetup) base['bedSetup'] = option.bedSetup;
    if (option.roomSizeSqm !== null) base['roomSizeSqm'] = option.roomSizeSqm;
    if (option.amenities.length > 0) base['amenities'] = option.amenities.join(',');

    return base;
  }

  protected stayImage(roomTypeId: number): string {
    return roomPhotoUrl(roomTypeId);
  }

  protected displayDate(value: string): string {
    return toDisplayDate(value) || value;
  }

  private loadResults(criteria: StaySearchCriteria): void {
    this.problem.set(null);
    this.loading.set(true);
    this.currentPage.set(1);

    this.stays
      .search(criteria)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (results) => this.results.set(results),
        error: (error: unknown) => {
          this.results.set([]);
          this.problem.set(toProblemDetail(error));
        },
      });
  }
}

function readCriteria(route: ActivatedRoute): StaySearchCriteria {
  const params = route.snapshot.queryParamMap;
  const destination = params.get('destination') ?? '';
  const hotelId = Number(params.get('hotelId'));
  const hasHotelId = Number.isFinite(hotelId) && hotelId > 0;
  const checkIn = params.get('checkIn') || isoDateFromToday(0);
  const checkOut = params.get('checkOut') || isoDateFromToday(1);
  const party = readAccommodationPartyFromQuery(params, 2);

  return {
    destination: destination.trim(),
    hotelId: hasHotelId ? hotelId : null,
    checkIn,
    checkOut,
    adults: party.adults,
    childrenAges: party.childrenAges,
    pets: party.pets,
  };
}

function isoDateFromToday(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}
