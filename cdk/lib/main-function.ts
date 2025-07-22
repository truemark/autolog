import {ExtendedNodejsFunction} from 'truemark-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as path from 'path';
import {Duration} from 'aws-cdk-lib';
import {Architecture} from 'aws-cdk-lib/aws-lambda';
import {Effect, PolicyStatement, Role} from 'aws-cdk-lib/aws-iam';
import * as globals from './globals';
import {LogLevel} from './globals';

export interface MainFunctionProps {
  readonly deliveryStreamRole: Role;
  readonly deliveryStreamLogGroupName: string;
  readonly subscriptionFilterRole: Role;
  readonly logLevel: LogLevel;
  readonly firehoseProcessorArn: string;
}

export class MainFunction extends ExtendedNodejsFunction {
  constructor(scope: Construct, id: string, props: MainFunctionProps) {
    super(scope, id, {
      entry: path.join(
        __dirname,
        '..',
        '..',
        'handlers',
        'src',
        'main-handler.mts',
      ),
      architecture: Architecture.ARM_64,
      handler: 'handler',
      timeout: Duration.seconds(300),
      deploymentOptions: {
        createDeployment: false,
      },
      memorySize: 768,
      environment: {
        DELIVERY_STREAM_ROLE_ARN: props.deliveryStreamRole.roleArn,
        DELIVERY_STREAM_LOG_GROUP_NAME: props.deliveryStreamLogGroupName,
        SUBSCRIPTION_FILTER_ROLE_ARN: props.subscriptionFilterRole.roleArn,
        AUTOMATION_NAME: globals.NAME,
        AUTOMATION_URL: globals.URL,
        LOG_LEVEL: props.logLevel,
        FIREHOSE_PROCESSOR_ARN: props.firehoseProcessorArn,
      },
    });
    this.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'logs:ListTagsForResource',
          'logs:PutSubscriptionFilter',
          'logs:DeleteSubscriptionFilter',
          'logs:DescribeSubscriptionFilters',
          'logs:CreateLogStream',
          'iam:PassRole',
          'firehose:CreateDeliveryStream',
          'firehose:DeleteDeliveryStream',
          'firehose:DescribeDeliveryStream',
          'firehose:TagDeliveryStream',
        ],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    );
  }
}
