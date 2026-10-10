import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FunctionaccessService } from '../../services/functionaccess.service';
import { StoreaccessService } from '../../services/storeaccess.service';

@Component({
  selector: 'app-squareredirect',
  templateUrl: './squareredirect.component.html',
  styleUrls: ['./squareredirect.component.scss']
})
export class SquareredirectComponent implements OnInit {
  private router = inject(Router);
  private actroute = inject(ActivatedRoute);
  private fnaService = inject(FunctionaccessService);
  private staService = inject(StoreaccessService);

  private code: string | null = null;

  ngOnInit(): void {
    this.actroute.queryParamMap.subscribe((params) => {
      this.code = params.get("code");
    });
  }

  getsquaretoken() {
    const office = this.staService.office;
    if (!this.code) {
      console.log("code is null");
      return;
    }
    this.fnaService.gettoken(this.code, office)
      .then((resp) => {
        console.log("get token:", resp);
        this.router.navigate(["settings", "connectionmgr"]);
      })
      .catch((error) => {
        console.log("error:", error.message);
      });
  }
}
