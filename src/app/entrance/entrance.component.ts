import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthaccessService } from '../services/authaccess.service';

@Component({
  selector: 'app-entrance',
  templateUrl: './entrance.component.html',
  styleUrls: ['./entrance.component.scss']
})
export class EntranceComponent {
  private router = inject(Router);
  private auaService = inject(AuthaccessService);

  pagerouting(value: string, sec: boolean) {
    if (sec) {
      const tailoruser = this.auaService.user();
      if (!tailoruser) {
        alert("サインインしてください。");
        return;
      }
      if (!((tailoruser.role == "super") || (tailoruser.role == "operator"))) {
        alert("権限がありません。");
        return;
      }
    }
    this.router.navigate([value]);
  }
}
