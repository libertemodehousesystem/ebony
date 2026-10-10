import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthaccessService } from '../services/authaccess.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private router = inject(Router);
  private auaService = inject(AuthaccessService);

  constructor() {
    if (!this.auaService.signined) {
      this.router.navigate([""]);
    }
  }

  pagerouting(value: string) {
    this.router.navigate(["settings", value]);
  }
}
