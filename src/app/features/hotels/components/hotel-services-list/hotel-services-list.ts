import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { HotelServiceOffering } from '../../model/hotel.model';

@Component({
  selector: 'app-hotel-services-list',
  imports: [CurrencyPipe],
  templateUrl: './hotel-services-list.html',
  styleUrl: './hotel-services-list.scss',
})
export class HotelServicesList {
  readonly services = input.required<readonly HotelServiceOffering[]>();
}
