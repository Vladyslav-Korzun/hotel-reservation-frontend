import { Component } from '@angular/core';

interface ServiceItem {
  marker: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-services-preview',
  templateUrl: './services-preview.html',
  styleUrl: './services-preview.scss',
})
export class ServicesPreview {
  protected readonly services: readonly ServiceItem[] = [
    { marker: 'B', title: 'Breakfast', description: 'Morning meals available at hotel restaurants.' },
    { marker: 'P', title: 'Parking', description: 'Secure on-site parking at selected properties.' },
    { marker: 'A', title: 'Pets allowed', description: 'Selected hotels welcome well-behaved pets.' },
    { marker: 'F', title: 'Family rooms', description: 'Spacious rooms designed for families with children.' },
    { marker: 'W', title: 'Wellness', description: 'Spa and fitness facilities at selected hotels.' },
    { marker: 'T', title: 'Airport transfer', description: 'Private transfers for arrivals and departures.' },
    { marker: 'L', title: 'Late checkout', description: 'Extended checkout available on request.' },
  ];
}
