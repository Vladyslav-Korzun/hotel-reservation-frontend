import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { accommodationPartyToQueryParams } from '../../../../shared/accommodation/accommodation-party-query.util';
import { AuthService } from '../../../../core/auth/auth.service';
import { toProblemDetail } from '../../../../core/http/api-error.util';
import { ProblemDetail } from '../../../../core/http/problem-detail.model';
import { HotelNetworkCarousel } from '../../components/hotel-network-carousel/hotel-network-carousel';
import { HomeActions } from '../../components/home-actions/home-actions';
import { HomeHero } from '../../components/home-hero/home-hero';
import { ServicesPreview } from '../../components/services-preview/services-preview';
import { TravelInspiration } from '../../components/travel-inspiration/travel-inspiration';
import { HomeFinalCta } from '../../components/home-final-cta/home-final-cta';
import { Hotel } from '../../../hotels/model/hotel.model';
import { HotelsFacade } from '../../../hotels/services/hotels.facade';
import { StaySearchCriteria } from '../../../stays/model/stay-search.model';

@Component({
  selector: 'app-home-page',
  imports: [HomeHero, HotelNetworkCarousel, HomeActions, ServicesPreview, TravelInspiration, HomeFinalCta],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly hotelsFacade = inject(HotelsFacade);

  protected readonly hotels = signal<Hotel[]>([]);
  protected readonly hotelsLoading = signal(false);
  protected readonly hotelsProblem = signal<ProblemDetail | null>(null);

  constructor() {
    this.loadHotels();
  }

  protected searchStays(criteria: StaySearchCriteria): void {
    const queryParams = {
      destination: criteria.destination || null,
      hotelId: criteria.hotelId || null,
      checkIn: criteria.checkIn,
      checkOut: criteria.checkOut,
      ...accommodationPartyToQueryParams(criteria),
    };

    if (!this.auth.isAuthenticated()) {
      const targetUrl = this.router.createUrlTree(['/stays/search'], { queryParams }).toString();
      this.auth.login(targetUrl);
      return;
    }

    void this.router.navigate(['/stays/search'], { queryParams });
  }

  private loadHotels(): void {
    this.hotelsProblem.set(null);
    this.hotelsLoading.set(true);

    this.hotelsFacade
      .listHotels()
      .pipe(finalize(() => this.hotelsLoading.set(false)))
      .subscribe({
        next: (hotels) => this.hotels.set(hotels),
        error: (error: unknown) => {
          this.hotels.set([]);
          this.hotelsProblem.set(toProblemDetail(error));
        },
      });
  }
}
