/** Ordered steps of the reservation wizard. */
export enum WizardStep {
  Trip = 1,
  Guests = 2,
  Services = 3,
  Review = 4,
}

export const WIZARD_STEPS: ReadonlyArray<{
  step: WizardStep;
  label: string;
  hint: string;
}> = [
  { step: WizardStep.Trip, label: 'Trip details', hint: 'Step 1' },
  { step: WizardStep.Guests, label: 'Guest info', hint: 'Step 2' },
  { step: WizardStep.Services, label: 'Services', hint: 'Step 3' },
  { step: WizardStep.Review, label: 'Review', hint: 'Step 4' },
];
