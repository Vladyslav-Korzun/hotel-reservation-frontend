import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { accommodationPartyToQueryParams } from '../../../../shared/accommodation/accommodation-party-query.util';
import { AuthService } from '../../../../core/auth/auth.service';
import { HomeActions } from '../../components/home-actions/home-actions';
import { HomeHero } from '../../components/home-hero/home-hero';
import { StaySearchCriteria } from '../../../stays/model/stay-search.model';

@Component({
  selector: 'app-home-page',
  imports: [HomeHero, HomeActions],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected searchStays(criteria: StaySearchCriteria): void {
    const queryParams = {
      destination: criteria.destination,
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
}
