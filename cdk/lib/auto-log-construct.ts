import {Construct} from 'constructs';
import {MainFunction} from './main-function';
import {StandardQueue} from 'truemark-cdk-lib/aws-sqs';
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets';
import {Rule} from 'aws-cdk-lib/aws-events';
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';

export class AutoLogConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const deliveryStreamRole = new Role(this, 'DeliveryStreamRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
    });
    deliveryStreamRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: ['*'],
      })
    );

    const subscriptionFilterRole = new Role(this, 'SubscriptionFilterRole', {
      assumedBy: new ServicePrincipal('logs.amazonaws.com'),
    });
    subscriptionFilterRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['firehose:PutRecord'],
        resources: ['*'],
      })
    );

    const mainFunction = new MainFunction(this, 'MainFunction', {
      deliveryStreamRole,
      subscriptionFilterRole,
    });
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
          'changed-tag-keys': ['autolog:destination'],
        },
      },
      description: 'Routes tag events to AutoLog',
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
      description: 'Routes log group events to AutoLog',
    });
    logGroupRule.addTarget(mainTarget);
  }
}
