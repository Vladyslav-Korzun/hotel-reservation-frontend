import { Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { WIZARD_STEPS, WizardStep } from '../../wizard/wizard-step';

interface StepView {
  step: WizardStep;
  label: string;
  hint: string;
  state: 'done' | 'current' | 'upcoming';
  index: number;
  isLast: boolean;
}

@Component({
  selector: 'app-reservation-stepper',
  templateUrl: './reservation-stepper.html',
  styleUrl: './reservation-stepper.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ReservationStepper {
  readonly currentStep = input.required<WizardStep>();
  /** Highest step the user has unlocked — controls which previous steps are clickable. */
  readonly maxReachableStep = input<WizardStep>(WizardStep.Trip);
  readonly stepClick = output<WizardStep>();

  protected readonly steps = computed<readonly StepView[]>(() => {
    const current = this.currentStep();
    return WIZARD_STEPS.map((s, i) => ({
      step: s.step,
      label: s.label,
      hint: s.hint,
      state: s.step < current ? 'done' : s.step === current ? 'current' : 'upcoming',
      index: i,
      isLast: i === WIZARD_STEPS.length - 1,
    }));
  });

  protected onStepClick(step: WizardStep): void {
    if (step <= this.maxReachableStep()) {
      this.stepClick.emit(step);
    }
  }

  protected isClickable(step: WizardStep): boolean {
    return step <= this.maxReachableStep();
  }
}
