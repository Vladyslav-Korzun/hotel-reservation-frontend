import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../../auth/user-role';

interface NavbarItem {
  label: string;
  path?: string;
  action?: 'login' | 'logout';
  roles?: readonly UserRole[];
  authenticatedOnly?: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements AfterViewInit {
  @ViewChild('navLinksRoot', { read: ElementRef })
  private readonly navLinksRoot?: ElementRef<HTMLElement>;

  @ViewChildren('navItem', { read: ElementRef })
  private readonly navItems?: QueryList<ElementRef<HTMLElement>>;

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUrl = signal(this.router.url);

  private viewReady = false;
  private animationFrameId = 0;

  protected readonly items: readonly NavbarItem[] = [
    {
      label: 'Home',
      path: '/',
    },
    {
      label: 'Hotels',
      path: '/hotels',
      authenticatedOnly: true,
      roles: ['GUEST', 'STAFF', 'ADMIN'],
    },
    {
      label: 'Search',
      path: '/stays/search',
      authenticatedOnly: true,
      roles: ['GUEST', 'STAFF', 'ADMIN'],
    },
    {
      label: 'My reservations',
      path: '/reservations/my',
      authenticatedOnly: true,
      roles: ['GUEST'],
    },
    {
      label: 'Staff',
      path: '/staff',
      authenticatedOnly: true,
      roles: ['STAFF', 'ADMIN'],
    },
    {
      label: 'Admin',
      path: '/admin',
      authenticatedOnly: true,
      roles: ['ADMIN'],
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

  protected readonly visibleItems = computed<readonly NavbarItem[]>(() => [
    ...this.items.filter((item) => this.canShowItem(item)),
    this.authItem(),
  ]);

  protected readonly activeLabel = computed(() => this.resolveActiveLabel());
  protected readonly username = computed(() => this.auth.user()?.username ?? '');

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.closeMenu();
        this.scheduleIndicatorUpdate();
      });

    effect(() => {
      this.visibleItems();
      this.activeLabel();

      if (this.viewReady) {
        this.scheduleIndicatorUpdate();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;

    this.navItems?.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.scheduleIndicatorUpdate());

    this.scheduleIndicatorUpdate();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (window.innerWidth > 768) {
      this.closeMenu();
    }

    this.scheduleIndicatorUpdate();
  }

  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
    }
  }

  protected runAction(item: NavbarItem): void {
    this.closeMenu();

    if (item.action === 'login') {
      this.auth.login(window.location.pathname + window.location.search);
      return;
    }

    if (item.action === 'logout') {
      this.auth.logout();
    }
  }

  private scheduleIndicatorUpdate(): void {
    if (!this.viewReady) {
      return;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = 0;
      this.updateIndicator();
    });
  }

  private updateIndicator(): void {
    const linksRoot = this.navLinksRoot?.nativeElement;
    const activeElement = this.navItems
      ?.toArray()
      .map((item) => item.nativeElement)
      .find((element) => element.classList.contains('active'));

    if (!linksRoot || !activeElement) {
      linksRoot?.style.setProperty('--indicator-width', '0px');
      return;
    }

    const rootRect = linksRoot.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();

    const left = activeRect.left - rootRect.left + linksRoot.scrollLeft;

    linksRoot.style.setProperty('--indicator-left', `${left}px`);
    linksRoot.style.setProperty('--indicator-width', `${activeRect.width}px`);
  }

  private resolveActiveLabel(): string {
    const currentUrl = this.currentUrl();
    const matchedItem = this.visibleItems().find((item) => item.path && this.matchesPath(currentUrl, item.path));

    return matchedItem?.label ?? 'Home';
  }

  private canShowItem(item: NavbarItem): boolean {
    if (!item.authenticatedOnly) {
      return true;
    }

    if (!this.auth.isAuthenticated()) {
      return false;
    }

    return !item.roles?.length || this.auth.hasAnyRole(item.roles);
  }

  private matchesPath(currentUrl: string, itemPath: string): boolean {
    if (itemPath === '/') {
      return currentUrl === '/';
    }

    return currentUrl === itemPath || currentUrl.startsWith(`${itemPath}/`) || currentUrl.startsWith(`${itemPath}?`);
  }
}
