import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { FormControl } from '@angular/forms';

export interface SelectOption {
  value: unknown;
  label: string;
}

@Component({
  selector: 'app-search-select-field',
  templateUrl: './search-select-field.html',
  styleUrl: './search-select-field.scss',
})
export class SearchSelectField {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly iconClass = input.required<string>();
  readonly displayLabel = input.required<string>();
  readonly control = input.required<FormControl>();
  readonly ariaLabel = input('');
  readonly options = input<SelectOption[]>([]);
  readonly opened = output<void>();

  protected readonly isOpen = signal(false);

  protected toggle(): void {
    const opening = !this.isOpen();
    this.isOpen.update((v) => !v);
    if (opening) this.opened.emit();
  }

  close(): void {
    this.isOpen.set(false);
  }

  protected select(value: unknown): void {
    this.control().setValue(value);
    this.control().markAsTouched();
    this.isOpen.set(false);
  }

  protected isSelected(value: unknown): boolean {
    return this.control().value === value;
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
