import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ACCOMMODATION_LIMITS } from '../../../../shared/accommodation/accommodation-limits';
import { formatAccommodationPartySummary } from '../../../../shared/accommodation/accommodation-party-presenter.util';
import {
  PetFormGroup,
  readChildrenAges,
  readPets,
  syncChildrenAgesCount,
} from '../../../../shared/accommodation/guests-form.util';
import { PetEditorList } from '../../../../shared/accommodation/pet-editor-list/pet-editor-list';

const CHILD_AGE_OPTIONS = Array.from({ length: 18 }, (_, age) => age);

@Component({
  selector: 'app-guests-picker',
  imports: [ReactiveFormsModule, NgTemplateOutlet, PetEditorList],
  templateUrl: './guests-picker.html',
  styleUrl: './guests-picker.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GuestsPicker {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly adultsControl = input.required<FormControl<number>>();
  readonly childrenAgesArray = input.required<FormArray<FormControl<number | null>>>();
  readonly petsArray = input.required<FormArray<PetFormGroup>>();
  readonly compact = input(false);
  /** Optional error shown below the trigger in non-compact mode */
  readonly guestsError = input('');
  /** When false → children counter is disabled, hint shown. */
  readonly childrenAllowed = input(true);
  /** When true → render an age dropdown per child inside the popover.
   *  Used in search where we don't know each child's DOB yet but the backend
   *  needs real ages to classify infant/child against the hotel policy. */
  readonly showAges = input(false);

  protected readonly childAgeOptions = CHILD_AGE_OPTIONS;
  protected readonly maxAdults = ACCOMMODATION_LIMITS.MAX_ADULTS;
  protected readonly maxChildren = ACCOMMODATION_LIMITS.MAX_CHILDREN;
  protected readonly maxPets = ACCOMMODATION_LIMITS.MAX_PETS;

  protected readonly isOpen = signal(false);

  /** Re-render trigger that bumps whenever the form array length changes (push/pop). */
  private readonly arrayVersion = signal(0);

  /** Which child's age picker is currently expanded (`null` = all collapsed). */
  private readonly expandedChildIndex = signal<number | null>(null);

  protected isChildExpanded(index: number): boolean {
    return this.expandedChildIndex() === index;
  }

  protected toggleChildExpansion(index: number): void {
    this.expandedChildIndex.update((curr) => (curr === index ? null : index));
  }

  protected readonly summary = computed(() => {
    this.arrayVersion(); // subscribe to structural changes
    return formatAccommodationPartySummary({
      adults: Number(this.adultsControl().value),
      childrenAges: readChildrenAges(this.childrenAgesArray()),
      pets: readPets(this.petsArray()),
    });
  });

  protected readonly childrenCount = computed(() => {
    this.arrayVersion();
    return this.childrenAgesArray().controls.length;
  });

  protected readonly petsCount = computed(() => {
    this.arrayVersion();
    return this.petsArray().controls.length;
  });

  /** Called by parent to close this popover */
  close(): void {
    this.isOpen.set(false);
  }

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected childrenAgeControls(): FormControl<number | null>[] {
    return this.childrenAgesArray().controls;
  }

  protected childAgeLabel(age: number): string {
    return `${age} ${age === 1 ? 'year' : 'years'} old`;
  }

  protected setChildAge(index: number, age: number): void {
    const control = this.childrenAgesArray().at(index);
    if (!control) return;
    control.setValue(age);
    control.markAsTouched();
    // Collapse the row once the age is picked.
    this.expandedChildIndex.set(null);
  }

  protected changeAdults(delta: number): void {
    const control = this.adultsControl();
    const next = clamp(Number(control.value) + delta, 1, this.maxAdults);
    control.setValue(next);
    control.markAsTouched();
  }

  protected changeChildren(delta: number): void {
    if (!this.childrenAllowed()) return;
    const prevCount = this.childrenCount();
    const next = clamp(prevCount + delta, 0, this.maxChildren);
    syncChildrenAgesCount(this.childrenAgesArray(), next);
    // Auto-expand the newly added child so the user lands on the chip grid.
    if (next > prevCount) {
      this.expandedChildIndex.set(next - 1);
    } else if (this.expandedChildIndex() !== null && this.expandedChildIndex()! >= next) {
      // The expanded row got removed
      this.expandedChildIndex.set(null);
    }
    this.arrayVersion.update((v) => v + 1);
  }

  @HostListener('document:click', ['$event'])
  protected onOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen.set(false);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
