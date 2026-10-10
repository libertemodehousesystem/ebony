import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { VerificationService } from '@lib/shared';

@Component({
  imports: [DatePipe, QRCodeComponent],
  selector: 'liberte-commerce-next-verifications',
  templateUrl: './verifications.component.html',
  styleUrls: ['./verifications.component.scss'],
})
export class VerificationsComponent implements OnInit {
  private verificationService = inject(VerificationService);

  readonly verificationsWithUrl = signal<any[]>([]);
  readonly showQr = signal(false);
  readonly selectedVerification = signal<any>(null);

  openQr(v) {
    this.selectedVerification.set(v);
    this.showQr.set(true);
  }

  closeQr() {
    this.showQr.set(false);
  }

  ngOnInit(): void {
    this.verificationService.loadAllVerifications().then((verifications) => {
      this.verificationsWithUrl.set(verifications.map((verification) => ({
        ...verification,
        url: `https://www.hosei.shitatekan.com/freshman-sales/${verification['email']}/${verification['digits']}`,
      })));
    });
  }
}
