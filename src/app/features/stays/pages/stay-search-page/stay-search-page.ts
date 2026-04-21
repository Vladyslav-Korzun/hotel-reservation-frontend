import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StaySearchForm } from '../../components/stay-search-form/stay-search-form';
import { StayOption, StaySearchCriteria } from '../../model/stay-search.model';
import { StayCatalogService } from '../../services/stay-catalog.service';

@Component({
  selector: 'app-stay-search-page',
  imports: [RouterLink, StaySearchForm],
  templateUrl: './stay-search-page.html',
  styleUrl: './stay-search-page.scss',
})
export class StaySearchPage {
  private readonly catalog = inject(StayCatalogService);
  private readonly route = inject(ActivatedRoute);
  protected readonly criteria = signal<StaySearchCriteria | null>(null);
  protected readonly results = computed(() => {
    const criteria = this.criteria();
    return criteria ? this.catalog.search(criteria) : [];
  });

  constructor() {
    this.criteria.set(readCriteria(this.route));
  }

  protected search(criteria: StaySearchCriteria): void {
    this.criteria.set(criteria);
  }

  protected reservationParams(option: StayOption): Record<string, string | number> {
    const criteria = this.criteria();

    return {
      hotelId: option.hotelId,
      hotelName: option.hotelName,
      roomTypeId: option.roomTypeId,
      roomName: option.roomName,
      location: option.location,
      checkIn: criteria?.checkIn ?? '',
      checkOut: criteria?.checkOut ?? '',
      guestCount: criteria?.guests ?? 1,
    };
  }

  protected stayImage(index: number): string {
    return STAY_IMAGES[index % STAY_IMAGES.length];
  }

  protected displayDate(value: string): string {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
  }
}

function readCriteria(route: ActivatedRoute): StaySearchCriteria | null {
  const params = route.snapshot.queryParamMap;
  const destination = params.get('destination') ?? '';
  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  const guests = Number(params.get('guests'));

  if (!destination || !checkIn || !checkOut || !Number.isFinite(guests) || guests < 1) {
    return null;
  }

  return {
    destination,
    checkIn,
    checkOut,
    guests,
  };
}

const STAY_IMAGES = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693537228-2a1f1c3b1d5c?auto=format&fit=crop&w=1200&q=80',
] as const;
