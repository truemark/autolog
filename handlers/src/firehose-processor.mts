import {
  FirehoseTransformationEvent,
  FirehoseTransformationResult,
  FirehoseRecordTransformationStatus,
} from 'aws-lambda';

// CloudWatch Logs event interface
interface CloudWatchLogEvent {
  messageType: string;
  owner: string;
  logGroup: string;
  logStream: string;
  subscriptionFilters: string[];
  logEvents: Array<{
    id: string;
    timestamp: number;
    message: string;
  }>;
}

// Individual parsed log event
interface LogEvent {
  [key: string]: string | number | undefined | object;
}

export const handler = async (
  event: FirehoseTransformationEvent,
): Promise<FirehoseTransformationResult> => {
  const output = event.records.map((record) => {
    const payload = Buffer.from(record.data, 'base64')
      .toString('utf8')
      .replace(/^\uFEFF/, '')
      .replace(/\0+$/, '')
      .trim();

    let parsed: any; // Use any so we can check shape dynamically
    try {
      parsed = JSON.parse(payload);
    } catch (err) {
      console.error('Failed to parse record:', err, payload);
      return {
        recordId: record.recordId,
        result: 'ProcessingFailed' as FirehoseRecordTransformationStatus,
        data: record.data,
      };
    }

    // Check if this looks like a CloudWatch Logs event
    const isCloudWatchLogs =
      parsed.messageType && parsed.logEvents && Array.isArray(parsed.logEvents);

    // If CloudWatch Logs, handle multiple logEvents
    if (isCloudWatchLogs) {
      const cwParsed = parsed as CloudWatchLogEvent;

      if (cwParsed.messageType === 'CONTROL_MESSAGE') {
        return {
          recordId: record.recordId,
          result: 'Dropped' as FirehoseRecordTransformationStatus,
          data: record.data,
        };
      }

      const logGroupArn = `arn:aws:logs:${event.region}:${cwParsed.owner}:log-group:${cwParsed.logGroup}`;

      const enrichedLines = cwParsed.logEvents.map((logEvent) => {
        const cleanedMessage = logEvent.message.replace(/\0+$/, '');

        let messageParsed: LogEvent;
        try {
          messageParsed = JSON.parse(cleanedMessage);
        } catch {
          messageParsed = {message: cleanedMessage};
        }

        return JSON.stringify({
          ...messageParsed,
          logGroup: cwParsed.logGroup,
          logStream: cwParsed.logStream,
          logGroupArn,
        });
      });

      const finalPayload = enrichedLines.join('\n') + '\n';

      return {
        recordId: record.recordId,
        result: 'Ok' as FirehoseRecordTransformationStatus,
        data: Buffer.from(finalPayload).toString('base64'),
      };
    }

    // ELSE: handle raw events (e.g., Logstash)
    // Just sanitize and output as-is, no enrichment
    const cleanedPayload = payload.replace(/\0+$/, '');

    return {
      recordId: record.recordId,
      result: 'Ok' as FirehoseRecordTransformationStatus,
      data: Buffer.from(cleanedPayload + '\n').toString('base64'),
    };
  });

  return {records: output};
};
