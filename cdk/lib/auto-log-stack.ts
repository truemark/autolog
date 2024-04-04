import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {Construct} from 'constructs';
import {AutoLogConstruct} from './auto-log-construct';

export class AutoLogStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);
    new AutoLogConstruct(this, 'Autolog');
  }
}
