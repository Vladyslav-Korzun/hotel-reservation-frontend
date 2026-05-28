import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AccommodationParty } from '../../../../shared/accommodation/accommodation-party.model';
import {
  accommodationPartyToQueryParams,
  readAccommodationPartyFromQuery,
} from '../../../../shared/accommodation/accommodation-party-query.util';
import { hotelPhotoUrl, roomGalleryPhotos, unsplashUrl } from '../../../../shared/assets/placeholder-images';
import {
  groupAmenities,
  ROOM_AMENITY_META,
} from '../../../../shared/accommodation/room-amenities';
import { RoomAmenityCodeDto } from '../../../hotels/api/hotel.dto';
import { Hotel, HotelServiceOffering } from '../../../hotels/model/hotel.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { RoomBookingCard } from '../../components/room-booking-card/room-booking-card';
import { RoomGallery } from '../../components/room-gallery/room-gallery';
import { RoomSimilarCard } from '../../components/room-similar-card/room-similar-card';
import { RoomStatsStrip } from '../../components/room-stats-strip/room-stats-strip';
import { StayOption } from '../../model/stay-search.model';
import { StaysFacade } from '../../services/stays.facade';

const SIMILAR_ROOMS_LIMIT = 4;

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
  /** Carried from search via query params; `null`/empty hide their tiles/section. */
  bedSetup: string | null;
  roomSizeSqm: number | null;
  amenities: RoomAmenityCodeDto[];
}

@Component({
  selector: 'app-stay-detail-page',
  imports: [RouterLink, CurrencyPipe, RoomGallery, RoomStatsStrip, RoomBookingCard, RoomSimilarCard],
  templateUrl: './stay-detail-page.html',
  styleUrl: './stay-detail-page.scss',
})
export class StayDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly hotelsFacade = inject(HotelsFacade);
  private readonly staysFacade = inject(StaysFacade);

  protected readonly stay = readStayDetail(this.route);

  protected readonly services = toSignal(
    this.hotelsFacade.getHotelServices(this.stay.hotelId),
    { initialValue: [] as HotelServiceOffering[] },
  );

  /** Hotel age policy (infantMaxAge / childMaxAge / childrenAllowed) — null until loaded. */
  protected readonly hotel = toSignal(
    this.hotelsFacade.getHotelDetails(this.stay.hotelId).pipe(catchError(() => of<Hotel | null>(null))),
    { initialValue: null as Hotel | null },
  );

  protected readonly similarRooms = toSignal(this.loadSimilarRooms(), {
    initialValue: [] as StayOption[],
  });

  protected readonly galleryPhotos = roomGalleryPhotos(this.stay.roomTypeId, 5);

  protected readonly mainImage = this.galleryPhotos[0];

  protected readonly thumbImages = this.galleryPhotos;

  protected readonly hotelImage = unsplashUrl(
    hotelPhotoUrl(this.stay.hotelId),
    600,
  );

  protected readonly searchQueryParams: Params = {
    hotelId: this.stay.hotelId,
    destination: this.stay.location || null,
    checkIn: this.stay.checkIn,
    checkOut: this.stay.checkOut,
    ...accommodationPartyToQueryParams(this.stay),
  };

  /** Categorised amenity sections for the "What this room offers" grid. */
  protected readonly amenitySections = groupAmenities(this.stay.amenities);

  /**
   * Load other available rooms in the same city for the same dates.
   * Excludes the current room and caps to SIMILAR_ROOMS_LIMIT results.
   */
  private loadSimilarRooms(): Observable<StayOption[]> {
    if (!this.stay.location || !this.stay.checkIn || !this.stay.checkOut) {
      return of([]);
    }

    return this.staysFacade
      .search({
        destination: this.stay.location,
        hotelId: null,
        checkIn: this.stay.checkIn,
        checkOut: this.stay.checkOut,
        adults: this.stay.adults,
        childrenAges: this.stay.childrenAges,
        pets: this.stay.pets,
      })
      .pipe(
        map((rooms) =>
          rooms
            .filter((r) => r.roomTypeId !== this.stay.roomTypeId)
            .slice(0, SIMILAR_ROOMS_LIMIT),
        ),
      );
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
    maxAdults: normalizePositiveNumber(query.get('maxAdults'), party.adults),
    maxChildren: normalizeNonNegativeNumber(query.get('maxChildren'), 0),
    maxInfants: normalizeNonNegativeNumber(query.get('maxInfants'), 0),
    maxTotalGuests: normalizePositiveNumber(
      query.get('maxTotalGuests'),
      party.adults + party.childrenAges.length,
    ),
    petsAllowed: query.get('petsAllowed') === 'true',
    maxPets: normalizeNonNegativeNumber(query.get('maxPets'), 0),
    availableCount: normalizePositiveNumber(query.get('availableCount'), 0),
    nightlyPrice: normalizePositiveNumber(query.get('nightlyPrice'), 0),
    currency: query.get('currency')?.trim() || 'EUR',
    bedSetup: query.get('bedSetup')?.trim() || null,
    roomSizeSqm: normalizeOptionalPositiveNumber(query.get('roomSizeSqm')),
    amenities: parseAmenitiesParam(query.get('amenities')),
  };
}

/** CSV `WIFI,SAFE,SEA_VIEW` → typed enum array, dropping unknown codes. */
function parseAmenitiesParam(value: string | null): RoomAmenityCodeDto[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is RoomAmenityCodeDto => s in ROOM_AMENITY_META);
}

function normalizeOptionalPositiveNumber(value: string | null): number | null {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizePositiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeNonNegativeNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
