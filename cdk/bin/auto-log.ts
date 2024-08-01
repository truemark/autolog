#!/usr/bin/env node
import 'source-map-support/register';
import {ExtendedApp} from 'truemark-cdk-lib/aws-cdk';
import {AutoLogStack} from '../lib/auto-log-stack';
import {isSupportedRegion, SupportedRegions} from '../lib/regions';

const app = new ExtendedApp({
  standardTags: {
    automationTags: {
      id: 'AutoLog',
      url: 'https://github.com/truemark/autolog',
    },
  },
});

if (!isSupportedRegion(app.region)) {
  console.error(`Region ${app.region} is not supported`);
  console.error(
    `Supported regions are:\n  ${Object.keys(SupportedRegions).join('\n  ')}`
  );
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}

new AutoLogStack(app, 'AutoLog', {});
