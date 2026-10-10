import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: 'shopmaint', loadComponent: () => import('./shopmaintenance/shopmaintenance.component').then(m => m.ShopmaintenanceComponent) },
      { path: 'itemmaint', loadComponent: () => import('./itemmaintenance/itemmaintenance.component').then(m => m.ItemmaintenanceComponent) },
      { path: 'itemcategorymaint', loadComponent: () => import('./itemcategorymaintenance/itemcategorymaintenance.component').then(m => m.ItemcategorymaintenanceComponent) },
      { path: 'customersmgr', loadComponent: () => import('./customermanager/customermanager.component').then(m => m.CustomermanagerComponent) },
      { path: 'cartmgr', loadComponent: () => import('./cartmanager/cartmanager.component').then(m => m.CartmanagerComponent) },
      { path: 'connectionmgr', loadComponent: () => import('./connectionmanager/connectionmanager.component').then(m => m.ConnectionmanagerComponent) },
      { path: 'squareredirect', loadComponent: () => import('./squareredirect/squareredirect.component').then(m => m.SquareredirectComponent) },
      { path: 'squarestart', loadComponent: () => import('./squarestart/squarestart.component').then(m => m.SquarestartComponent) },
      { path: 'postagemaint', loadComponent: () => import('./postagemaintenance/postagemaintenance.component').then(m => m.PostagemaintenanceComponent) },
      { path: 'printermgr', loadComponent: () => import('./printermanager/printermanager.component').then(m => m.PrintermanagerComponent) },
      { path: 'orderingmgr', loadComponent: () => import('./orderingmanager/orderingmanager.component').then(m => m.OrderingmanagerComponent) },
      { path: 'qrcodetester', loadComponent: () => import('../lib/qrcode/liberte-qrcode.component').then(m => m.LiberteQRCode) },
      { path: 'verifications', loadComponent: () => import('./verifications/verifications.component').then(m => m.VerificationsComponent) },
      { path: 'extracustomermgr', loadComponent: () => import('./extracustomermanager/extracustomermanager.component').then(m => m.ExtracustomermanagerComponent) },
      { path: 'deliverylist', loadComponent: () => import('./deliverylist/deliverylist.component').then(m => m.DeliverylistComponent) },
      { path: 'funccheck', loadComponent: () => import('./funccheck/funccheck.component').then(m => m.FunccheckComponent) },
      { path: 'addmove', loadComponent: () => import('./addmove/addmove.component').then(m => m.AddmoveComponent) },
    ],
  },
];
