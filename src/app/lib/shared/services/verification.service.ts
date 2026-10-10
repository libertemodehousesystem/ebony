import { Injectable } from '@angular/core';
import { addMinutes } from 'date-fns';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {

  createVerification(email: string) {
    let randomDigits = "";
    for (let i = 0; i < 6; i++) {
      randomDigits = randomDigits + (Math.floor(Math.random() * 9) + 1);
    }
    setDoc(doc(db, 'commerce/customers/verifications', email), { email: email, digits: randomDigits, created_at: new Date() });
    return randomDigits;
  }

  async verifyMailAndRandomDigit(email: string, digits: string) {
    const snap = await getDoc(doc(db, 'commerce/customers/verifications', email));
    if (snap.exists()) {
      const data = snap.data();
      const expirationTime = addMinutes(data['created_at'].toDate(), 30);
      if (expirationTime < new Date()) {
        return { error: true, message: "認証番号の利用期限を過ぎています。" };
      }
      if (data['digits'] != digits) {
        return { error: true, message: "認証番号が違います。" };
      }
      return { error: false, message: "認証されました。" };
    }
    return { error: true, message: "メールアドレスの入力に戻り、もう一度お試しください。" };
  }

  async loadAllVerifications() {
    const snaps = await getDocs(collection(db, 'commerce/customers/verifications'));
    const ret = snaps.docs.map((d) => d.data());
    ret.sort((a, b) => {
      if (a['created_at'] > b['created_at']) { return -1; }
      if (a['created_at'] < b['created_at']) { return 1; }
      return 0;
    });
    return ret;
  }
}
