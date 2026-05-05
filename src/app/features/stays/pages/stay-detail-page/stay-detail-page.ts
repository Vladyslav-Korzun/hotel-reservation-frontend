import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccommodationParty } from '../../../../shared/accommodation/accommodation-party.model';
import { formatAccommodationPartySummary } from '../../../../shared/accommodation/accommodation-party-presenter.util';
import {
  accommodationPartyToQueryParams,
  readAccommodationPartyFromQuery,
} from '../../../../shared/accommodation/accommodation-party-query.util';
import { toDisplayDate } from '../../../../shared/date/display-date.util';

interface StayDetailViewModel extends AccommodationParty {
  hotelId: number;
  roomTypeId: number;
  hotelName: string;
  roomName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  maxTotalGuests: number;
  petsAllowed: boolean;
  maxPets: number;
  availableCount: number;
  nightlyPrice: number;
  currency: string;
}

@Component({
  selector: 'app-stay-detail-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './stay-detail-page.html',
  styleUrl: './stay-detail-page.scss',
})
export class StayDetailPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly stay = readStayDetail(this.route);
  protected readonly reserveQueryParams = {
    hotelId: this.stay.hotelId,
    hotelName: this.stay.hotelName,
    roomTypeId: this.stay.roomTypeId,
    roomName: this.stay.roomName,
    location: this.stay.location,
    checkIn: this.stay.checkIn,
    checkOut: this.stay.checkOut,
    ...accommodationPartyToQueryParams(this.stay),
  };
  protected readonly searchQueryParams = {
    hotelId: this.stay.hotelId,
    destination: this.stay.location || null,
    checkIn: this.stay.checkIn,
    checkOut: this.stay.checkOut,
    ...accommodationPartyToQueryParams(this.stay),
  };

  protected displayDate(value: string): string {
    return toDisplayDate(value) || value;
  }

  protected stayImage(): string {
    return STAY_IMAGES[(this.stay.hotelId + this.stay.roomTypeId) % STAY_IMAGES.length];
  }

  protected partySummary(): string {
    return formatAccommodationPartySummary(this.stay);
  }

  protected highlights(): string[] {
    return [
      `Up to ${this.stay.maxAdults} adults and ${this.stay.maxChildren} children`,
      `Supports ${this.stay.maxInfants} infant${this.stay.maxInfants === 1 ? '' : 's'} and ${this.stay.maxTotalGuests} total guests`,
      `${this.stay.availableCount} room${this.stay.availableCount === 1 ? '' : 's'} available for these dates`,
      this.stay.petsAllowed ? `Pets allowed up to ${this.stay.maxPets}` : 'Pets are not allowed for this room type',
      this.stay.location || 'Available across the current hotel catalog',
    ];
  }

  protected travelNotes(): string[] {
    return [
      `Stay period: ${this.displayDate(this.stay.checkIn)} to ${this.displayDate(this.stay.checkOut)}`,
      `Selected party: ${this.partySummary()}`,
      'Reservation form will open with this room already selected',
    ];
  }
}

function readStayDetail(route: ActivatedRoute): StayDetailViewModel {
  const params = route.snapshot.paramMap;
  const query = route.snapshot.queryParamMap;

  const hotelId = Number(params.get('hotelId'));
  const roomTypeId = Number(params.get('roomTypeId'));
  const hotelName = query.get('hotelName')?.trim() || (hotelId > 0 ? `Hotel #${hotelId}` : 'Selected hotel');
  const roomName = query.get('roomName')?.trim() || (roomTypeId > 0 ? `Room #${roomTypeId}` : 'Selected room');
  const location = query.get('location')?.trim() ?? '';
  const checkIn = query.get('checkIn') ?? '';
  const checkOut = query.get('checkOut') ?? '';
  const party = readAccommodationPartyFromQuery(query, 1);
  const maxAdults = normalizePositiveNumber(query.get('maxAdults'), party.adults);
  const maxChildren = normalizeNonNegativeNumber(query.get('maxChildren'), 0);
  const maxInfants = normalizeNonNegativeNumber(query.get('maxInfants'), 0);
  const maxTotalGuests = normalizePositiveNumber(query.get('maxTotalGuests'), party.adults + party.childrenAges.length);
  const petsAllowed = query.get('petsAllowed') === 'true';
  const maxPets = normalizeNonNegativeNumber(query.get('maxPets'), 0);
  const availableCount = normalizePositiveNumber(query.get('availableCount'), 0);
  const nightlyPrice = normalizePositiveNumber(query.get('nightlyPrice'), 0);
  const currency = query.get('currency')?.trim() || 'EUR';

  return {
    hotelId,
    roomTypeId,
    hotelName,
    roomName,
    location,
    checkIn,
    checkOut,
    adults: party.adults,
    childrenAges: party.childrenAges,
    pets: party.pets,
    maxAdults,
    maxChildren,
    maxInfants,
    maxTotalGuests,
    petsAllowed,
    maxPets,
    availableCount,
    nightlyPrice,
    currency,
  };
}

function normalizePositiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeNonNegativeNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const STAY_IMAGES = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1505693537228-2a1f1c3b1d5c?auto=format&fit=crop&w=2000&q=80',
] as const;
