import { computed, inject, Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

import { auth } from '../lib/firebase';
import { Customer, StoreaccessService } from './storeaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';

export interface TailorUser {
  uid: string;
  email: string;
  user_name: string;
  role: string;
}

export interface UserRole {
  uid: string;
  role: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthaccessService {
  private staService = inject(StoreaccessService);

  private _tailoruser = signal<TailorUser | null>(null);
  private _tailorcustomer = signal<Customer | null>(null);

  /** テンプレート/computed から参照するためのシグナル */
  readonly user = this._tailoruser.asReadonly();
  readonly isSignedIn = computed(() => this._tailoruser() !== null);
  readonly customer = this._tailorcustomer.asReadonly();

  /** Firebase Auth の初期状態が確定するまで待つ(ガード用) */
  readonly ready: Promise<void>;

  constructor() {
    this.customerloadstorage();
    this.ready = new Promise<void>((resolve) => {
      let first = true;
      onAuthStateChanged(auth, async (afuser) => {
        await this.applyuser(afuser);
        if (first) {
          first = false;
          resolve();
        }
      });
    });
  }

  get signined() {
    return this._tailoruser() !== null;
  }

  get tailoruser() {
    return this._tailoruser();
  }

  get tailorcustomer() {
    return this._tailorcustomer();
  }

  private async applyuser(afuser: User | null) {
    if (!afuser) {
      this._tailoruser.set(null);
      return;
    }
    let userrole: UserRole | null = null;
    try {
      userrole = await lastValueFrom(this.staService.getuserrole(afuser.uid));
    } catch (error) {
      commonlib.errorlog(error);
    }
    console.log("userrole:", userrole);
    this._tailoruser.set({
      uid: afuser.uid,
      email: afuser.email,
      user_name: "",
      role: userrole ? userrole.role : null,
    });
  }

  async tailormeasuresignin(signinuser): Promise<TailorUser> {
    const credential = await signInWithEmailAndPassword(auth, signinuser.email, signinuser.password);
    await this.applyuser(credential.user);
    return this._tailoruser();
  }

  async tailormeasuresignout() {
    try {
      await signOut(auth);
      this._tailoruser.set(null);
    } catch (error) {
      commonlib.errorlog(error);
    }
  }

  customersavestorage(tailorcustomer: Customer) {
    this._tailorcustomer.set(tailorcustomer);
    try {
      localStorage.setItem("tailorcustomer", JSON.stringify(tailorcustomer));
    } catch { /* 保存できなくても動作は継続 */ }
  }

  customerloadstorage() {
    let customer: Customer | null = null;
    try {
      const ltcustomer = localStorage.getItem("tailorcustomer");
      customer = ltcustomer ? JSON.parse(ltcustomer) : null;
    } catch { /* ignore */ }
    this._tailorcustomer.set(customer);
    return customer;
  }

  customerresetstorage() {
    try {
      localStorage.removeItem("tailorcustomer");
    } catch { /* ignore */ }
    this._tailorcustomer.set(null);
  }
}
