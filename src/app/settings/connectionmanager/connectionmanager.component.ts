import { Component, inject, OnInit, signal } from '@angular/core';

import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

import { StoreaccessService } from '../../services/storeaccess.service';
import { FunctionaccessService } from '../../services/functionaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-connectionmanager',
  templateUrl: './connectionmanager.component.html',
  styleUrls: ['./connectionmanager.component.scss']
})
export class ConnectionmanagerComponent implements OnInit {

  private routing = inject(Router);
  private fnaService = inject(FunctionaccessService);
  private staService = inject(StoreaccessService);

  readonly access = signal({
    basepath: null,
    client_id: "",
    client_secret: "",
  });
  readonly token = signal({
    access_token: null,
    expires_at: null,
    merchant_id: null,
    refresh_token: null,
    short_lived: null,
    token_type: null,
  });
  readonly currentlocation = signal<any>(null);
  readonly locations = signal<any[]>([]);

  ngOnInit(): void {
    this.getaccess();
    this.gettoken();
    forkJoin([this.getlocation(),this.getsquarelocations()]).subscribe({
      next: (results) => {
        this.currentlocation.set(results[0]);
        this.locations.set(results[1]);
      }
    })
  }

  getaccess(){
    this.staService.getaccessinformation().subscribe({
      next: (resaccess) => {
        this.access.set({
          basepath: resaccess.basepath,
          client_id: resaccess.client_id,
          client_secret: resaccess.client_secret,
        });
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  gettoken(){
    this.staService.gettokeninformation().subscribe({
      next: (restoken) => {
        if(restoken){
          this.token.set({
            access_token: restoken.access_token,
            expires_at: restoken.expires_at,
            merchant_id: restoken.merchant_id,
            refresh_token: restoken.refresh_token,
            short_lived: restoken.short_lived,
            token_type: restoken.token_type,
          });
        }
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  tokenrefresh(){
    this.fnaService.refreshtoken(this.staService.office)
    .then((restoken) => {
      console.log("restoken:",restoken);
      this.gettoken();
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  getsquarelocations(){
    return this.staService.getsquarelocations();
  }

  getlocation(){
    return this.staService.getlocation();
  }

  locationchange(location){
    this.staService.setlocation(location)
    .then((result) => {
      //
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  dolinkagelocation(){
    Promise.resolve()
    .then(() => {
      return this.fnaService.getlocations(this.staService.office);
    })
    .then((resp) => {
      console.log("locations:",resp);
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  routingpage(value){
    this.routing.navigate(["settings",value]);
  }
}
