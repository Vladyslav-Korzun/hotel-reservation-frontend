import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { hotelPhotoUrl } from '../../../../shared/assets/placeholder-images';
import { toTitleCase } from '../../../../shared/text/title-case.util';
import { Hotel } from '../../model/hotel.model';

@Component({
  selector: 'app-hotel-card',
  imports: [RouterLink],
  templateUrl: './hotel-card.html',
  styleUrl: './hotel-card.scss',
})
export class HotelCard {
  readonly hotel = input.required<Hotel>();

  protected imageUrl(): string {
    return hotelImageUrl(this.hotel().hotelId);
  }

  protected locationLabel(): string {
    const hotel = this.hotel();
    return `${hotel.city}, ${hotel.country}`.toUpperCase();
  }

  protected searchParams(): Record<string, string | number> {
    const hotel = this.hotel();
    return {
      destination: hotel.city,
      hotelId: hotel.hotelId,
    };
  }

  protected starsLabel(): string {
    const count = this.hotel().stars;
    return `${count} ${count === 1 ? 'star' : 'stars'}`;
  }

  protected childrenPolicyLabel(): string {
    return this.hotel().childrenAllowed ? 'Children welcome' : 'Adults only';
  }

  protected petsPolicyLabel(): string {
    return this.hotel().petsAllowed ? 'Pets welcome' : 'No pets';
  }

  protected statusLabel(): string {
    return toTitleCase(this.hotel().status.replace(/_/g, ' '));
  }

  protected imageAlt(): string {
    return `${this.hotel().name} hotel`;
  }
}

function hotelImageUrl(hotelId: number): string {
  return hotelPhotoUrl(hotelId);
}
