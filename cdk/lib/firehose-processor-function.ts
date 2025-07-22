import {ExtendedNodejsFunction} from 'truemark-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as path from 'path';
import {Duration, Stack} from 'aws-cdk-lib';
import {Architecture} from 'aws-cdk-lib/aws-lambda';
import {Effect, PolicyStatement} from 'aws-cdk-lib/aws-iam';

export class FirehoseProcessorFunction extends ExtendedNodejsFunction {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      entry: path.join(
        __dirname,
        '..',
        '..',
        'handlers',
        'src',
        'firehose-processor.mts',
      ),
      handler: 'handler',
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(300),
      deploymentOptions: {
        createDeployment: false,
      },
      memorySize: 768,
    });

    // Add CloudWatch Logs permissions
    this.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${Stack.of(this).region}:${Stack.of(this).account}:log-group:/aws/lambda/${id}*:*`,
        ],
      }),
    );
  }
}
