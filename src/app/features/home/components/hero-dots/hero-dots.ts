import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-hero-dots',
  templateUrl: './hero-dots.html',
  styleUrl: './hero-dots.scss',
})
export class HeroDots {
  readonly slidesCount = input.required<number>();
  readonly activeIndex = input.required<number>();
  readonly slideSelected = output<number>();

  protected slideIndexes(): number[] {
    return Array.from({ length: this.slidesCount() }, (_, index) => index);
  }
}
