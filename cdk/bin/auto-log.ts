#!/usr/bin/env node
import 'source-map-support/register';
import {ExtendedApp} from 'truemark-cdk-lib/aws-cdk';
import {AutoLogStack} from '../lib/auto-log-stack';

const app = new ExtendedApp({
  standardTags: {
    automationTags: {
      id: 'overwatch',
      url: 'https://github.com/truemark/overwatch',
    },
  },
});

new AutoLogStack(app, 'AutoLog', {});
