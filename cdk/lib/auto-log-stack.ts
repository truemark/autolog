import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {Construct} from 'constructs';
import {AutoLogConstruct} from './auto-log-construct';
import {CfnOutput} from 'aws-cdk-lib';
import * as globals from './globals';
import * as p from '../../package.json';

export class AutoLogStack extends ExtendedStack {
  readonly name: CfnOutput;
  readonly version: CfnOutput;
  readonly url: CfnOutput;
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);
    this.outputParameter('Name', 'AutoDump');
    this.outputParameter('Version', p.version);
    new AutoLogConstruct(this, 'AutoLog');
    this.name = this.outputParameter('Name', globals.NAME);
    this.version = this.outputParameter('Version', globals.NAME);
    this.url = this.outputParameter('Url', globals.URL);
  }
}
