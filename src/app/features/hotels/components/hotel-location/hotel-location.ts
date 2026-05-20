import { Component, input } from '@angular/core';
import { Hotel } from '../../model/hotel.model';

/**
 * Text-only location card. Address comes from the backend; map and
 * nearby-points lists are intentionally omitted per the design decision.
 *
 * // TODO(backend): expose nearby points-of-interest (`hotel.nearby[]`)
 *                  or build a POI service to bring back walk / drive lists.
 */
@Component({
  selector: 'app-hotel-location',
  templateUrl: './hotel-location.html',
  styleUrl: './hotel-location.scss',
})
export class HotelLocation {
  readonly hotel = input.required<Hotel>();
}
