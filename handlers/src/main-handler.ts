import {initialize, Logger} from '@nr1e/logging';
import {
  CloudWatchLogsClient,
  ListTagsForResourceCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {FirehoseClient} from '@aws-sdk/client-firehose';

const cloudWatchLogsClient = new CloudWatchLogsClient({});
const firehoseClient = new FirehoseClient({});

interface TagEvent {
  source: string;
  resources: string[];
}

function isTagEvent(event: unknown): event is TagEvent {
  return (
    (event as TagEvent).source === 'aws.tag' &&
    Array.isArray((event as TagEvent).resources)
  );
}

interface LogGroupEvent {
  source: string;
  detail: LogGroupEventDetail;
}

interface LogGroupEventDetail {
  requestParameters: LogGroupEventRequestParameters;
  eventName: string;
}

interface LogGroupEventRequestParameters {
  logGroupName: string;
}

function isLogGroupEvent(event: unknown): event is LogGroupEvent {
  return (
    (event as LogGroupEvent).source === 'aws.logs' &&
    ((event as LogGroupEvent).detail.eventName === 'CreateLogGroup' ||
      (event as LogGroupEvent).detail.eventName === 'DeleteLogGroup')
  );
}

interface AutoLogTags {
  openSearchIndex: string | undefined;
  openSearchUrl: string | undefined;
}

async function getTags(log: Logger, arn: string): Promise<AutoLogTags | null> {
  const command = new ListTagsForResourceCommand({
    resourceArn: arn,
  });
  const response = await cloudWatchLogsClient.send(command);
  if (response.tags !== undefined) {
    const tags = {
      openSearchIndex: response.tags['autolog:opensearch-index'],
      openSearchUrl: response.tags['autolog:opensearch-url'],
    };
    log.trace().unknown('tags', tags).str('arn', arn).msg('Retrieved tags');
    return tags;
  }
  return null;
}

// Delivery stream name is AutoLog-OpenSearch-AccountId-DomainName-Index
// TODO deliveryStreamExists()
// TODO createDeliveryStream()
// TODO deleteDeliveryStream()
// Subscription filter name is AutoLog-OpenSearch-AccountId-DomainName-Index
// TODO subscriptionFilterExists()
// TODO createSubscriptionFilter()
// TODO deleteSubscriptionFilter()

export async function handler(event: unknown): Promise<void> {
  const log = await initialize({
    svc: 'AutoLog',
    name: 'main-handler',
    level: 'trace',
  });
  if (isTagEvent(event)) {
    log.trace().unknown('event', event).msg('Received tag event');
    for (const resource of event.resources) {
      const tags = await getTags(log, resource);
    }
  } else if (isLogGroupEvent(event)) {
    log.trace().unknown('event', event).msg('Received log group event');
  } else {
    log.error().unknown('event', event).msg('Unknown event');
  }
}
