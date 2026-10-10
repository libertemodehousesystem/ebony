import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// super: 全機能 / operator: 採寸・購入・カート・会計・個人ページ
const superOnly = { canActivate: [authGuard], data: { roles: ['super'] } };
const superOrOperator = { canActivate: [authGuard], data: { roles: ['super', 'operator'] } };

export const routes: Routes = [
  { path: '', loadComponent: () => import('./entrance/entrance.component').then(m => m.EntranceComponent), ...superOrOperator },
  { path: 'study', loadComponent: () => import('./studymeasure/studymeasure.component').then(m => m.StudymeasureComponent), ...superOnly },
  { path: 'measuring', loadComponent: () => import('./measuring/measuring.component').then(m => m.MeasuringComponent), ...superOrOperator },
  { path: 'purchasing', loadComponent: () => import('./purchasing/purchasing.component').then(m => m.PurchasingComponent), ...superOrOperator },
  { path: 'accounting', loadComponent: () => import('./accounting/accounting.component').then(m => m.AccountingComponent), ...superOrOperator },
  { path: 'customer', loadComponent: () => import('./customer/customer.component').then(m => m.CustomerComponent), ...superOrOperator },
  { path: 'cart', loadComponent: () => import('./shoppingcart/shoppingcart.component').then(m => m.ShoppingcartComponent), ...superOrOperator },
  { path: 'receipt', loadComponent: () => import('./receipt/receipt.component').then(m => m.ReceiptComponent), ...superOnly },
  { path: 'settings', loadChildren: () => import('./settings/settings.routes').then(m => m.settingsRoutes), ...superOnly },
  { path: 'qrcodes', loadComponent: () => import('./lib/qrcode/liberte-qrcode.component').then(m => m.LiberteQRCode) },
];
