import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';

import { StoreaccessService } from '../../services/storeaccess.service';

import { environment } from '../../../environments/environment';

import * as commonlib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

declare function StarWebPrintTrader(options): void;
declare function StarWebPrintBuilder(): void;

@Component({
  imports: [FormsModule, NgClass],
  selector: 'app-printermanager',
  templateUrl: './printermanager.component.html',
  styleUrls: ['./printermanager.component.scss'],
})
export class PrintermanagerComponent implements OnInit, AfterViewInit {
  printprotocol = environment.printprotocol;
  private staService = inject(StoreaccessService);

  readonly printer_addr = signal('localhost');

  readonly banks = signal<any[]>([]);

  readonly new_bank = signal(this.emptybank());

  readonly canvasPaper = viewChild<ElementRef>('CanvasPaper');
  cvscontext: CanvasRenderingContext2D;

  private emptybank() {
    return {
      bank_uid: null,
      bank_ordinal: 0,
      bank_name: '',
      shiten_name: '',
      bank_kind: '',
      bank_koza: '',
      created_at: null,
    };
  }

  ngOnInit(): void {
    this.getprintersetting();
    this.getbanks();
  }

  ngAfterViewInit(): void {
    // canvasの領域作成
    this.cvscontext = this.canvasPaper().nativeElement.getContext('2d');
  }

  getprintersetting() {
    this.staService.getprintersetting().subscribe({
      next: (setting) => {
        this.printer_addr.set(setting.printer_addr);
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    });
  }

  getbanks() {
    this.staService.getbanks().subscribe({
      next: (resbanks) => {
        this.banks.set(resbanks);
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    });
  }

  registprintersetting() {
    this.staService
      .setprintersetting(this.printer_addr())
      .then(() => {
        //
      })
      .catch((error) => {
        commonlib.errorlog(error);
      });
  }

  printertest() {
    this.sendMessageCanvas();
  }

  sendMessageCanvas() {
    if (this.cvscontext) {
      this.cvscontext.font = '28px monospace';

      let cursor = 0;

      this.cvscontext.textBaseline = 'top';
      const canvasPaper = this.canvasPaper();
      this.cvscontext.clearRect(
        0,
        0,
        canvasPaper.nativeElement.width,
        canvasPaper.nativeElement.height,
      );
      const centerPosition = (canvasPaper.nativeElement.width - 16) / 2;
      this.cvscontext.textAlign = 'center';
      this.cvscontext.fillText('テスト印刷', centerPosition, cursor);
      cursor += 28;

      cursor += 28;

      const banks = this.banks();
      for (const i in banks) {
        this.cvscontext.textAlign = 'left';
        this.cvscontext.fillText(
          `${banks[i].bank_name} ${banks[i].shiten_name}`,
          0,
          cursor,
        );
        cursor += 28;
        this.cvscontext.textAlign = 'left';
        if (banks[i].bank_kind == 'NORMAL') {
          this.cvscontext.fillText(`普通口座 ${banks[i].bank_koza}`, 0, cursor);
          cursor += 28;
        } else if (banks[i].bank_kind == 'CURRENT') {
          this.cvscontext.fillText(`当座口座 ${banks[i].bank_koza}`, 0, cursor);
          cursor += 28;
        }

        cursor += 14;
      }

      let trader = new StarWebPrintTrader({
        url: `${this.printprotocol}${this.printer_addr()}/StarWebPRNT/SendMessage`,
      });
      console.log(
        `send printer: ${this.printprotocol}${this.printer_addr()}/StarWebPRNT/SendMessage`,
      );

      try {
        let builder = new StarWebPrintBuilder();
        let request = '';
        request += builder.createInitializationElement();
        request += builder.createBitImageElement({
          context: this.cvscontext,
          x: 0,
          y: 0,
          width: canvasPaper.nativeElement.width,
          height: canvasPaper.nativeElement.height,
        });
        request += builder.createCutPaperElement({ feed: true });
        trader.sendMessage({ request: request });
      } catch (e) {
        console.log(e.message);
      }
    }
  }
  changebankkind(bank, kind) {
    bank.bank_kind = kind;
    this.setbank(bank);
  }

  addbank() {
    const newbank = this.new_bank();
    const regbank = {
      bank_uid: newbank.bank_uid,
      bank_ordinal: this.banks().length + 1,
      bank_name: newbank.bank_name,
      shiten_name: newbank.shiten_name,
      bank_kind: newbank.bank_kind,
      bank_koza: newbank.bank_koza,
      created_at: newbank.created_at,
    };
    this.staService
      .setbank(regbank)
      .then((resbank) => {
        this.banks.update((banks) => [...banks, resbank]);
        this.new_bank.set(this.emptybank());
      })
      .catch((error) => {
        commonlib.errorlog(error);
      });
  }

  setbank(bank) {
    this.staService
      .setbank(bank)
      .then(() => {
        //
      })
      .catch((error) => {
        commonlib.errorlog(error);
      });
  }

  async upordinal(i) {
    if (i > 0) {
      this.banks.update((banks) => {
        const next = [...banks];
        const holdbank = next.splice(i, 1)[0];
        next.splice(i - 1, 0, holdbank);
        return next;
      });
      // 番号を付けなおす
      await this.updateordinal();
    }
  }

  async downordinal(i) {
    if (i < this.banks().length - 1) {
      this.banks.update((banks) => {
        const next = [...banks];
        const holdbank = next.splice(i, 1)[0];
        next.splice(i + 1, 0, holdbank);
        return next;
      });
      // 番号を付けなおす
      await this.updateordinal();
    }
  }

  async updateordinal() {
    const banks = this.banks();
    banks.forEach((bank, i) => (bank.bank_ordinal = i + 1));
    // storeの更新
    for (const bank of banks) {
      await this.staService
        .setbank(bank)
        .then(() => {
          //
        })
        .catch((error) => {
          commonlib.errorlog(error);
        });
    }
  }
}
