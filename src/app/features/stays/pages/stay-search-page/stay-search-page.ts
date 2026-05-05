import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
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
  private readonly stays = inject(StaysFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly criteria = signal<StaySearchCriteria | null>(null);
  protected readonly loading = signal(false);
  protected readonly problem = signal<ProblemDetail | null>(null);
  protected readonly results = signal<StayOption[]>([]);

  constructor() {
    const criteria = readCriteria(this.route);
    this.criteria.set(criteria);

    if (criteria) {
      this.loadResults(criteria);
    }
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
      ...(criteria ? accommodationPartyToQueryParams(criteria) : accommodationPartyToQueryParams({ adults: 1, childrenAges: [], pets: [] })),
    };
  }

  protected roomDetailsLink(option: StayOption): string[] {
    return ['/stays', String(option.hotelId), 'rooms', String(option.roomTypeId)];
  }

  protected roomDetailsQueryParams(option: StayOption): Record<string, string | number> {
    const criteria = this.criteria();

    return {
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
  }

  protected stayImage(index: number): string {
    return STAY_IMAGES[index % STAY_IMAGES.length];
  }

  protected displayDate(value: string): string {
    return toDisplayDate(value) || value;
  }

  private loadResults(criteria: StaySearchCriteria): void {
    this.problem.set(null);
    this.loading.set(true);

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

function readCriteria(route: ActivatedRoute): StaySearchCriteria | null {
  const params = route.snapshot.queryParamMap;
  const destination = params.get('destination') ?? '';
  const hotelId = Number(params.get('hotelId'));
  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  const party = readAccommodationPartyFromQuery(params, 1);

  if (!checkIn || !checkOut) {
    return null;
  }

  return {
    destination: destination.trim(),
    hotelId: Number.isFinite(hotelId) && hotelId > 0 ? hotelId : null,
    checkIn,
    checkOut,
    adults: party.adults,
    childrenAges: party.childrenAges,
    pets: party.pets,
  };
}

const STAY_IMAGES = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693537228-2a1f1c3b1d5c?auto=format&fit=crop&w=1200&q=80',
] as const;
