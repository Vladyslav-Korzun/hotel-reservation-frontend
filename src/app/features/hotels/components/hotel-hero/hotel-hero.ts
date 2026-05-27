import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { hotelPhotoUrl } from '../../../../shared/assets/placeholder-images';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Hotel } from '../../model/hotel.model';

@Component({
  selector: 'app-hotel-hero',
  imports: [RouterLink, StatusBadge],
  templateUrl: './hotel-hero.html',
  styleUrl: './hotel-hero.scss',
})
export class HotelHero {
  readonly hotel = input.required<Hotel>();

  /** Deterministic hero photo: same hotel always gets the same image. */
  protected readonly backgroundUrl = computed(() =>
    hotelPhotoUrl(this.hotel().hotelId),
  );

  /** Honest substitute for the mockup's invented "Boutique hotel · since 1923" line. */
  protected readonly eyebrow = computed(() => {
    const h = this.hotel();
    const star = h.stars > 0 ? `${h.stars}-star hotel` : 'Hotel';
    return `${star} in ${h.city}`;
  });

  /** "★★★★" filled stars only — no half steps from backend. */
  protected readonly starsLabel = computed(() => '★'.repeat(Math.max(0, Math.min(5, this.hotel().stars))));
}
