import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-home-actions',
  imports: [RouterLink],
  templateUrl: './home-actions.html',
  styleUrl: './home-actions.scss',
})
export class HomeActions {
  protected readonly auth = inject(AuthService);

  protected login(): void {
    this.auth.login('/');
  }
}
