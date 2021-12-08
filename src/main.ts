import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import config from './app/config';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

for (const key in config) {
  if (!config.hasOwnProperty(key)) continue;
  console.log(`${key}:\t${(config as any)[key]}`);
}