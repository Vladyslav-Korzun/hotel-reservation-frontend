import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-topbar',
  imports: [RouterLink],
  templateUrl: './hero-topbar.html',
  styleUrl: './hero-topbar.scss',
})
export class HeroTopbar {}
