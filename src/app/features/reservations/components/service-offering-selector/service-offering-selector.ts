import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { HotelServiceOffering } from '../../../hotels/model/hotel.model';
import { inferServicePricing } from '../../../hotels/model/service-pricing.util';
import { ReservationServiceSelection } from '../../model/reservation.model';

@Component({
  selector: 'app-service-offering-selector',
  imports: [CurrencyPipe],
  templateUrl: './service-offering-selector.html',
  styleUrl: './service-offering-selector.scss',
})
export class ServiceOfferingSelector {
  readonly services = input<readonly HotelServiceOffering[]>([]);
  readonly selectionsChanged = output<ReservationServiceSelection[]>();

  /** Signal-backed quantity map so template auto-updates on every change. */
  private readonly quantities = signal<Record<number, number>>({});

  protected readonly selections = computed<ReservationServiceSelection[]>(() =>
    Object.entries(this.quantities()).map(([id, quantity]) => ({
      serviceOfferingId: Number(id),
      quantity,
    })),
  );

  protected quantity(serviceOfferingId: number): number {
    return this.quantities()[serviceOfferingId] ?? 0;
  }

  protected isSelected(serviceOfferingId: number): boolean {
    return this.quantity(serviceOfferingId) > 0;
  }

  protected pricingLabel(service: HotelServiceOffering): string {
    return inferServicePricing(service) === 'PER_NIGHT' ? '/ night' : '/ stay';
  }

  protected increase(serviceOfferingId: number): void {
    this.quantities.update((q) => ({
      ...q,
      [serviceOfferingId]: (q[serviceOfferingId] ?? 0) + 1,
    }));
    this.emit();
  }

  protected decrease(serviceOfferingId: number): void {
    this.quantities.update((q) => {
      const next = (q[serviceOfferingId] ?? 0) - 1;
      const copy = { ...q };
      if (next <= 0) {
        delete copy[serviceOfferingId];
      } else {
        copy[serviceOfferingId] = next;
      }
      return copy;
    });
    this.emit();
  }

  private emit(): void {
    this.selectionsChanged.emit(this.selections());
  }
}
