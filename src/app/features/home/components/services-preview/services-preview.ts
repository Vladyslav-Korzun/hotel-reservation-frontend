import { Component, input } from '@angular/core';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { HotelServiceOffering } from '../../../hotels/model/hotel.model';

@Component({
  selector: 'app-services-preview',
  imports: [LoadingState],
  templateUrl: './services-preview.html',
  styleUrl: './services-preview.scss',
})
export class ServicesPreview {
  readonly services = input<HotelServiceOffering[]>([]);
  readonly loading = input(false);

  protected marker(service: HotelServiceOffering): string {
    return (service.code || service.name).charAt(0).toUpperCase();
  }
}
