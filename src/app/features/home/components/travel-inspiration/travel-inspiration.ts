import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface InspirationTile {
  title: string;
  text: string;
  imageUrl: string;
}

@Component({
  selector: 'app-travel-inspiration',
  imports: [RouterLink],
  templateUrl: './travel-inspiration.html',
  styleUrl: './travel-inspiration.scss',
})
export class TravelInspiration {
  protected readonly tiles: readonly InspirationTile[] = [
    {
      title: 'City stays',
      text: 'Convenient hotels in the heart of the city, close to business and culture.',
      imageUrl:
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Mountain resorts',
      text: 'Properties set in quiet natural surroundings, away from the urban pace.',
      imageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Wellness weekends',
      text: 'Hotels with spa and wellness facilities for rest and recovery.',
      imageUrl:
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Business trips',
      text: 'Comfortable rooms and quiet workspaces for productive stays.',
      imageUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Family stays',
      text: 'Spacious rooms and family-friendly services at selected hotels.',
      imageUrl:
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    },
  ];
}
