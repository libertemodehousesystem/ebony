import { AfterViewInit, Component, input, signal, viewChild } from '@angular/core';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { Subject } from 'rxjs';

@Component({
  imports: [ZXingScannerModule],
  selector: 'app-qrreaderdlg',
  templateUrl: './qrreaderdlg.component.html',
  styleUrls: ['./qrreaderdlg.component.scss'],
})
export class QrreaderdlgComponent implements AfterViewInit {
  readonly title = input('タイトル');

  resultSubject: Subject<any> = new Subject();
  resultState = this.resultSubject.asObservable();

  readonly qrscanner = viewChild<ZXingScannerComponent>('QRscanner');
  readonly devices = signal<MediaDeviceInfo[] | null>(null);
  readonly currentdevice = signal<MediaDeviceInfo | undefined>(undefined);
  readonly deviceselectorvisibility = signal<'hidden' | 'visible'>('hidden');

  ngAfterViewInit(): void {
    this.qrscanner().camerasFound.subscribe((devices: MediaDeviceInfo[]) => {
      this.devices.set(devices);
      this.currentdevice.set(devices[0]);
    });
    this.qrscanner().scanSuccess.subscribe((result) => {
      this.resultSubject.next(JSON.parse(result));
    });
  }

  selectdevice(device: MediaDeviceInfo) {
    this.deviceselectorvisibility.set('hidden');
    this.currentdevice.set(device);
  }

  devicechange(device: MediaDeviceInfo) {
    if (!device || this.currentdevice()?.deviceId == device.deviceId) {
      return;
    }
    this.currentdevice.set(device);
  }

  closedialog() {
    this.resultSubject.next(null);
  }

  deviceselector() {
    this.deviceselectorvisibility.update(v => v == 'hidden' ? 'visible' : 'hidden');
  }
}
