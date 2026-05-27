import { Component, OnDestroy, output, signal } from '@angular/core';
import { StaySearchForm } from '../../../stays/components/stay-search-form/stay-search-form';
import { StaySearchCriteria } from '../../../stays/model/stay-search.model';
import { HeroDots } from '../hero-dots/hero-dots';
import { HeroNote } from '../hero-note/hero-note';
import { HeroTopbar } from '../hero-topbar/hero-topbar';

@Component({
  selector: 'app-home-hero',
  imports: [HeroTopbar, StaySearchForm, HeroNote, HeroDots],
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.scss',
})
export class HomeHero implements OnDestroy {
  readonly searchSubmitted = output<StaySearchCriteria>();
  protected readonly slides = HERO_SLIDES;
  protected readonly activeSlideIndex = signal(0);
  private readonly autoplayHandle = window.setInterval(() => {
    this.selectSlide((this.activeSlideIndex() + 1) % this.slides.length);
  }, 6500);

  protected submitSearch(criteria: StaySearchCriteria): void {
    this.searchSubmitted.emit(criteria);
  }

  protected selectSlide(index: number): void {
    this.activeSlideIndex.set(index);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.autoplayHandle);
  }
}

const HERO_SLIDES = [
  { imageUrl: '/images/hero/hero-1.jpg' },
  { imageUrl: '/images/hero/hero-2.jpg' },
  { imageUrl: '/images/hero/hero-3.jpg' },
  { imageUrl: '/images/hero/hero-4.jpg' },
] as const;
