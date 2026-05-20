import { Component, input, output } from '@angular/core';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { HotelServiceOffering } from '../../../hotels/model/hotel.model';
import { ReservationServiceSelection } from '../../model/reservation.model';
import { ServiceOfferingSelector } from '../service-offering-selector/service-offering-selector';

@Component({
  selector: 'app-step-services',
  imports: [ServiceOfferingSelector, LoadingState],
  templateUrl: './step-services.html',
  styleUrl: './step-services.scss',
})
export class StepServices {
  readonly services = input<readonly HotelServiceOffering[]>([]);
  readonly loading = input(false);

  readonly selectionsChanged = output<ReservationServiceSelection[]>();
  readonly back = output<void>();
  readonly next = output<void>();
}
