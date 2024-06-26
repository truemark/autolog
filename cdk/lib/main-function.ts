import {ExtendedNodejsFunction} from 'truemark-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as path from 'path';
import {Duration} from 'aws-cdk-lib';
import {Architecture} from 'aws-cdk-lib/aws-lambda';
import {Effect, PolicyStatement, Role} from 'aws-cdk-lib/aws-iam';

export interface MainFunctionProps {
  readonly deliveryStreamRole: Role;
  readonly deliveryStreamLogGroupName: string;
  readonly subscriptionFilterRole: Role;
  // readonly failedLogsBucket: Bucket;
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
        'main-handler.ts'
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
        // FIREHOSE_ARN:
        //   'arn:aws:firehose:us-west-2:381492266277:deliverystream/test',
        // FIREHOSE_ROLE_ARN: props.firehoseRole.roleArn,
        // FAILED_LOGS_BUCKET_ARN: props.failedLogsBucket.bucketArn,
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
        ],
        resources: ['*'],
        effect: Effect.ALLOW,
      })
    );
  }
}
