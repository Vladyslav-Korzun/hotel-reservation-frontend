import { Component, input } from '@angular/core';
import { ProblemDetail } from '../../../core/http/problem-detail.model';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.html',
  styleUrl: './error-message.scss',
})
export class ErrorMessage {
  readonly problem = input.required<ProblemDetail>();
}
