import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { STAY_PHOTO_IDS, unsplashUrl } from '../../../../shared/assets/placeholder-images';
import { StayOption } from '../../model/stay-search.model';

@Component({
  selector: 'app-room-similar-card',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './room-similar-card.html',
  styleUrl: './room-similar-card.scss',
})
export class RoomSimilarCard {
  readonly option = input.required<StayOption>();
  readonly checkIn = input('');
  readonly checkOut = input('');
  readonly location = input('');
  /** Show the hotel name on the card only when it differs from the page hotel */
  readonly currentHotelId = input<number | null>(null);

  protected readonly showHotelName = computed(
    () => this.currentHotelId() !== this.option().hotelId,
  );

  protected readonly imgSrc = computed(() => {
    const opt = this.option();
    return unsplashUrl(STAY_PHOTO_IDS[(opt.hotelId + opt.roomTypeId) % STAY_PHOTO_IDS.length], 800);
  });

  protected readonly capacityLabel = computed(() => {
    const opt = this.option();
    const parts = [`${opt.maxAdults} adults`];
    if (opt.maxChildren > 0) {
      parts.push(`${opt.maxChildren} ${opt.maxChildren === 1 ? 'child' : 'children'}`);
    }
    return parts.join(' · ');
  });

  protected readonly linkQueryParams = computed<Params>(() => {
    const opt = this.option();
    return {
      hotelName: opt.hotelName,
      roomName: opt.roomName,
      location: this.location() || null,
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      nightlyPrice: opt.nightlyPrice,
      currency: opt.currency,
      availableCount: opt.availableCount,
      maxAdults: opt.maxAdults,
      maxChildren: opt.maxChildren,
      maxInfants: opt.maxInfants,
      maxTotalGuests: opt.maxTotalGuests,
      petsAllowed: opt.petsAllowed,
      maxPets: opt.maxPets,
    };
  });
}
