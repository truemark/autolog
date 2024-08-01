#!/usr/bin/env node
import 'source-map-support/register';
import {ExtendedApp} from 'truemark-cdk-lib/aws-cdk';
import {AutoLogStack} from '../lib/auto-log-stack';
import {isSupportedRegion, SupportedRegions} from '../lib/regions';
import * as globals from '../lib/globals';

const app = new ExtendedApp({
  standardTags: {
    automationTags: {
      id: globals.NAME,
      url: globals.URL,
    },
  },
});

if (!isSupportedRegion(app.region)) {
  console.error(`Region ${app.region} is not supported`);
  console.error(
    `Supported regions are:\n  ${Object.keys(SupportedRegions).join('\n  ')}`
  );
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

new AutoLogStack(app, 'AutoLog', {});
