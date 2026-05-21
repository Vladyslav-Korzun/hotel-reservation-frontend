import { Component, computed, inject } from '@angular/core';
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
  protected readonly canSelfBook = computed(() => this.auth.hasAnyRole(['GUEST']));
}
