import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
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

  protected searchStays(criteria: StaySearchCriteria): void {
    void this.router.navigate(['/stays/search'], {
      queryParams: {
        destination: criteria.destination,
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        guests: criteria.guests,
      },
    });
  }
}
