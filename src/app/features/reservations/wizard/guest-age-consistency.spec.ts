import { UNKNOWN_BOOKING_POLICY } from '../../../shared/accommodation/booking-policy';
import { createGuestDetailControl } from './guest-detail';
import { getGuestAgeConsistencyIssue } from './guest-age-consistency';

describe('guest age consistency', () => {
  it('rejects adult rows younger than 18', () => {
    const guest = createGuestDetailControl('ADULT');
    guest.controls.dateOfBirth.setValue(displayDobForAge(17));

    const issue = getGuestAgeConsistencyIssue(guest, null, UNKNOWN_BOOKING_POLICY);

    expect(issue?.message).toContain('18 or older');
  });

  it('rejects child rows when date of birth leaves the selected infant range', () => {
    const guest = createGuestDetailControl('CHILD');
    guest.controls.dateOfBirth.setValue(displayDobForAge(17));

    const issue = getGuestAgeConsistencyIssue(guest, 1, UNKNOWN_BOOKING_POLICY);

    expect(issue?.message).toContain('infant');
  });

  it('rejects teen rows when date of birth falls back into the child range', () => {
    const guest = createGuestDetailControl('CHILD');
    guest.controls.dateOfBirth.setValue(displayDobForAge(7));

    const issue = getGuestAgeConsistencyIssue(guest, 15, UNKNOWN_BOOKING_POLICY);

    expect(issue?.message).toContain('teen');
  });

  it('allows different exact ages inside the same selected child range', () => {
    const guest = createGuestDetailControl('CHILD');
    guest.controls.dateOfBirth.setValue(displayDobForAge(8));

    const issue = getGuestAgeConsistencyIssue(guest, 7, UNKNOWN_BOOKING_POLICY);

    expect(issue).toBeNull();
  });
});

function displayDobForAge(age: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join('.');
}
