import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-shell">
      <router-outlet />
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background: var(--bg-base);
    }
  `],
})
export class AppComponent {}
