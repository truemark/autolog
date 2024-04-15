import * as logging from '@nr1e/logging';
import {
  CreateDeliveryStreamCommand,
  DeliveryStreamStatus,
  DescribeDeliveryStreamCommand,
  FirehoseClient,
} from '@aws-sdk/client-firehose';
import {getAccountId} from './sts-helper';

const log = logging.getLogger('firehose-helper');
const client = new FirehoseClient({});

export interface DeliveryStreamDetails {
  readonly arn: string;
  readonly status: DeliveryStreamStatus;
}

export async function getDeliveryStream(
  name: string
): Promise<DeliveryStreamDetails | null> {
  try {
    const response = await client.send(
      new DescribeDeliveryStreamCommand({
        DeliveryStreamName: name,
      })
    );
    if (response.DeliveryStreamDescription !== undefined) {
      const details: DeliveryStreamDetails = {
        arn: response.DeliveryStreamDescription.DeliveryStreamARN!,
        status: response.DeliveryStreamDescription.DeliveryStreamStatus!,
      };
      log
        .trace()
        .unknown('details', details)
        .str('name', name)
        .msg('Retrieved delivery stream');
      return details;
    }
  } catch (e) {
    if ((e as Error).name !== 'ResourceNotFoundException') {
      throw e;
    }
  }
  return null;
}

export async function waitForDeliveryStreamActivation(
  name: string
): Promise<DeliveryStreamDetails> {
  let attempts = 0;
  while (attempts < 60) {
    const details = await getDeliveryStream(name);
    if (details === null) {
      throw new Error('Delivery stream does not exist');
    }
    if (details.status === 'ACTIVE') {
      return details;
    }
    if (details.status !== 'CREATING') {
      throw new Error(
        `Delivery stream cannot go active in status ${details.status}`
      );
    }
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error('Delivery stream did not activate');
}

export interface CreateDeliveryStreamProps {
  readonly name: string;
  readonly bucketArn: string;
  readonly roleArn: string;
  readonly logGroupName: string;
}

export async function createDeliveryStream(
  props: CreateDeliveryStreamProps
): Promise<string> {
  const command = new CreateDeliveryStreamCommand({
    DeliveryStreamName: props.name,
    DeliveryStreamType: 'DirectPut',
    ExtendedS3DestinationConfiguration: {
      RoleARN: props.roleArn,
      BucketARN: props.bucketArn,
      Prefix: `CloudWatch/${await getAccountId()}/${
        process.env['AWS_REGION']
      }/`,
      BufferingHints: {
        SizeInMBs: 128,
        IntervalInSeconds: 60,
      },
      CompressionFormat: 'GZIP',
      CloudWatchLoggingOptions: {
        Enabled: true,
        LogGroupName: props.logGroupName,
        LogStreamName: props.name,
      },
      ProcessingConfiguration: {
        Enabled: true,
        Processors: [
          {
            Type: 'Decompression',
            Parameters: [
              {
                ParameterName: 'NumberOfRetries',
                ParameterValue: '3',
              },
            ],
          },
          {
            Type: 'CloudWatchLogProcessing',
            Parameters: [
              {
                ParameterName: 'DataMessageExtraction',
                ParameterValue: 'True',
              },
            ],
          },
        ],
      },
      S3BackupMode: 'Disabled',
    },
  });
  const response = await client.send(command);
  log.trace().obj('response', response).msg('Created delivery stream');
  if (response.DeliveryStreamARN === undefined) {
    throw new Error('Delivery stream ARN is undefined');
  }
  return response.DeliveryStreamARN;
}
