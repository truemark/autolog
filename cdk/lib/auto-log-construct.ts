import {Construct} from 'constructs';
import {MainFunction} from './main-function';
import {StandardQueue} from 'truemark-cdk-lib/aws-sqs';
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets';
import {Rule} from 'aws-cdk-lib/aws-events';

export class AutoLogConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const mainFunction = new MainFunction(this, 'MainFunction');
    const deadLetterQueue = new StandardQueue(this, 'DeadLetterQueue');
    const mainTarget = new LambdaFunction(mainFunction, {
      deadLetterQueue,
    });

    const tagRule = new Rule(this, 'TagRule', {
      eventPattern: {
        source: ['aws.tag'],
        detailType: ['Tag Change on Resource'],
        detail: {
          service: ['logs'],
          'resource-type': ['log-group'],
          'changed-tag-keys': [
            'autolog:opensearch-index',
            'autolog:opensearch-url',
          ],
        },
      },
      description: 'Routes tag events to Overwatch',
    });
    tagRule.addTarget(mainTarget);

    const logGroupRule = new Rule(this, 'LogGroupRule', {
      eventPattern: {
        source: ['aws.logs'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['logs.amazonaws.com'],
          eventName: ['CreateLogGroup', 'DeleteLogGroup'],
        },
      },
      description: 'Routes log group events to Overwatch',
    });
    logGroupRule.addTarget(mainTarget);
  }
}
