import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-home-hero-dots',
  templateUrl: './home-hero-dots.html',
  styleUrl: './home-hero-dots.scss',
})
export class HomeHeroDots {
  readonly slidesCount = input.required<number>();
  readonly activeIndex = input.required<number>();
  readonly slideSelected = output<number>();

  protected slideIndexes(): number[] {
    return Array.from({ length: this.slidesCount() }, (_, index) => index);
  }
}
