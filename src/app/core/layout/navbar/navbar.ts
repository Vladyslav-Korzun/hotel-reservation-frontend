import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

interface NavbarItem {
  label: string;
  path?: string;
  action?: 'login' | 'logout';
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements AfterViewInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly currentUrl = signal(this.router.url);
  protected readonly indicatorLeft = signal(0);
  protected readonly indicatorWidth = signal(0);

  @ViewChildren('navLink')
  private readonly navLinks?: QueryList<ElementRef<HTMLElement>>;

  protected readonly items: readonly NavbarItem[] = [
    {
      label: 'Home',
      path: '/',
    },
    {
      label: 'List your property',
      path: '/reservations/new',
    },
    {
      label: 'Support',
      path: '/reservations/find',
    },
    {
      label: 'Trips',
      path: '/stays/search',
    },
  ];

  protected readonly authItem = computed<NavbarItem>(() =>
    this.auth.isAuthenticated()
      ? {
          label: 'Log out',
          action: 'logout',
        }
      : {
          label: 'Sign in',
          action: 'login',
        },
  );

  protected readonly visibleItems = computed<readonly NavbarItem[]>(() => [...this.items, this.authItem()]);
  protected readonly activeLabel = computed(() => this.resolveActiveLabel());

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.updateIndicator();
      });
  }

  protected runAction(item: NavbarItem): void {
    if (item.action === 'login') {
      this.auth.login(window.location.pathname + window.location.search);
      return;
    }

    if (item.action === 'logout') {
      this.auth.logout();
    }
  }

  ngAfterViewInit(): void {
    this.updateIndicator();
  }

  @HostListener('window:resize')
  protected updateIndicator(): void {
    window.requestAnimationFrame(() => {
      const links = this.navLinks?.toArray() ?? [];
      const activeIndex = this.visibleItems().findIndex((item) => item.label === this.activeLabel());
      const activeLink = links[activeIndex]?.nativeElement;

      if (!activeLink) {
        return;
      }

      this.indicatorLeft.set(activeLink.offsetLeft);
      this.indicatorWidth.set(activeLink.offsetWidth);
    });
  }

  private resolveActiveLabel(): string {
    const currentUrl = this.currentUrl();
    const matchedItem = this.items.find((item) => item.path && this.matchesPath(currentUrl, item.path));
    return matchedItem?.label ?? 'Home';
  }

  private matchesPath(currentUrl: string, itemPath: string): boolean {
    if (itemPath === '/') {
      return currentUrl === '/';
    }

    return currentUrl === itemPath || currentUrl.startsWith(`${itemPath}/`) || currentUrl.startsWith(`${itemPath}?`);
  }
}
