import * as logging from '@nr1e/logging';
import {
  CreateDeliveryStreamCommand,
  DeliveryStreamStatus,
  DescribeDeliveryStreamCommand,
  FirehoseClient,
} from '@aws-sdk/client-firehose';

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
}

export async function createDeliveryStream(
  props: CreateDeliveryStreamProps
): Promise<string> {
  const command = new CreateDeliveryStreamCommand({
    DeliveryStreamName: props.name,
    DeliveryStreamType: 'DirectPut',
    ExtendedS3DestinationConfiguration: {
      RoleARN: props.roleArn,
      // RoleARN: process.env['DELIVERY_STREAM_ROLE_ARN'], // TODO parameter check and pass through props
      BucketARN: props.bucketArn,
      // BucketARN: 'arn:aws:s3:::overwatch-overwatchlogsf7d351c6-z9rixknklgby', // TODO Parameter
      // Prefix: "STRING_VALUE", // TODO Noodle
      // ErrorOutputPrefix: "STRING_VALUE", // TODO Noodle
      // BufferingHints: { // TODO Nooddle
      //   SizeInMBs: 128,
      //   IntervalInSeconds: 60,
      // },
      CompressionFormat: 'Snappy',
      // EncryptionConfiguration: { // TODO Research
      //   NoEncryptionConfig: "NoEncryption",
      //   KMSEncryptionConfig: {
      //     AWSKMSKeyARN: "STRING_VALUE", // required
      //   },
      // },
      // CloudWatchLoggingOptions: { // TODO Add
      //   Enabled: true,
      //   LogGroupName: "STRING_VALUE",
      //   LogStreamName: "STRING_VALUE",
      // },
      // ProcessingConfiguration: { // ProcessingConfiguration // TODO Not sure we need this
      //   Enabled: true || false,
      //   Processors: [ // ProcessorList
      //     { // Processor
      //       Type: "RecordDeAggregation" || "Decompression" || "CloudWatchLogProcessing" || "Lambda" || "MetadataExtraction" || "AppendDelimiterToRecord", // required
      //       Parameters: [ // ProcessorParameterList
      //         { // ProcessorParameter
      //           ParameterName: "LambdaArn" || "NumberOfRetries" || "MetadataExtractionQuery" || "JsonParsingEngine" || "RoleArn" || "BufferSizeInMBs" || "BufferIntervalInSeconds" || "SubRecordType" || "Delimiter" || "CompressionFormat" || "DataMessageExtraction", // required
      //           ParameterValue: "STRING_VALUE", // required
      //         },
      //       ],
      //     },
      //   ],
      // },
      S3BackupMode: 'Disabled', // TODO Find out what this is
      // S3BackupConfiguration: {
      //   RoleARN: "STRING_VALUE", // required
      //   BucketARN: "STRING_VALUE", // required
      //   Prefix: "STRING_VALUE",
      //   ErrorOutputPrefix: "STRING_VALUE",
      //   BufferingHints: {
      //     SizeInMBs: Number("int"),
      //     IntervalInSeconds: Number("int"),
      //   },
      //   CompressionFormat: "UNCOMPRESSED" || "GZIP" || "ZIP" || "Snappy" || "HADOOP_SNAPPY",
      //   EncryptionConfiguration: {
      //     NoEncryptionConfig: "NoEncryption",
      //     KMSEncryptionConfig: {
      //       AWSKMSKeyARN: "STRING_VALUE", // required
      //     },
      //   },
      //   CloudWatchLoggingOptions: {
      //     Enabled: true || false,
      //     LogGroupName: "STRING_VALUE",
      //     LogStreamName: "STRING_VALUE",
      //   },
      // },
    },
  });
  const response = await client.send(command);
  log.trace().obj('response', response).msg('Created delivery stream');
  if (response.DeliveryStreamARN === undefined) {
    throw new Error('Delivery stream ARN is undefined');
  }
  return response.DeliveryStreamARN;
}
