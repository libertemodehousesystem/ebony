import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { AuthaccessService } from '../services/authaccess.service';

/**
 * Firebase Auth のログイン後に /userroles/tailormeasure/accounts/{uid} の role(super / operator)で制御する。
 * route.data['roles'] に許可する role を指定する。
 */
export const authGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthaccessService);

  await authService.ready;
  const user = authService.tailoruser;
  if (!user) {
    console.log('not logged in');
    return false;
  }
  const roles: string[] = route.data['roles'] ?? [];
  const allowed = roles.includes(user.role);
  if (!allowed) {
    console.log(`role not allowed: uid=${user.uid} role=${JSON.stringify(user.role)} allowed=${JSON.stringify(roles)}`);
  }
  return allowed;
};
