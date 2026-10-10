import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthaccessService } from '../services/authaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';

@Component({
  imports: [FormsModule],
  selector: 'app-topmenubar',
  templateUrl: './topmenubar.component.html',
  styleUrls: ['./topmenubar.component.scss']
})
export class TopmenubarComponent {
  private auaService = inject(AuthaccessService);
  private router = inject(Router);
  private location = inject(Location);

  readonly tailoruser = this.auaService.user;
  readonly signined = this.auaService.isSignedIn;
  readonly cansettings = computed(() => this.tailoruser()?.role == "super");

  readonly userinfoboxvisibility = signal<'hidden' | 'visible'>('hidden');
  readonly signindisplay = signal(false);

  readonly burger = viewChild<ElementRef<HTMLElement>>("BurgerMenu");

  mailaddressdomain = "@liberte-mode.co.jp";
  preemail: string | null = null;
  prepassword: string | null = null;

  gototop() {
    this.router.navigate([""]);
    this.burgermenuaction();
  }

  gotoreceipt() {
    this.router.navigate(["receipt"]);
    this.burgermenuaction();
  }

  pagerouting(value: string) {
    if (this.signined()) {
      this.router.navigate([value]);
      this.burgermenuaction();
    }
    else {
      alert("サインインしてください。");
    }
  }

  nonpropagation(event: Event) {
    event.stopPropagation();
  }

  burgermenuaction() {
    const burger = this.burger()?.nativeElement;
    if (burger) {
      if (burger.classList.contains("burgermenuback")) {
        burger.classList.remove("burgermenuback");
        burger.classList.add("burgermenuback-active");
      }
      else {
        burger.classList.remove("burgermenuback-active");
        burger.classList.add("burgermenuback");
      }
    }
  }

  opensignindialog() {
    this.signindisplay.set(true);
  }

  closesignindialog() {
    this.signindisplay.set(false);
  }

  async signout() {
    await this.auaService.tailormeasuresignout();
    this.router.navigate([""]);
    this.userinfoboxvisibility.set('hidden');
  }

  userinfoappearance() {
    this.userinfoboxvisibility.update(v => v == 'hidden' ? 'visible' : 'hidden');
  }

  dosignin() {
    const signinuser = {
      email: this.preemail + this.mailaddressdomain,
      password: this.prepassword,
    };
    this.preemail = null;
    this.prepassword = null;
    this.auaService.tailormeasuresignin(signinuser)
      .then(() => {
        this.closesignindialog();
        // ガードで拒否されていたページを、サインイン後の role で再評価する
        this.router.navigateByUrl(this.location.path() || '/');
      })
      .catch((error) => {
        commonlib.errorlog(error);
        alert("サインインできません。");
      });
  }
}
