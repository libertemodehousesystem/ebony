import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation(),
      // サインイン後に同じ URL を再評価してガードを通し直せるようにする
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
  ]
};
