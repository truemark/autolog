# AutoLog

## Supported Tags

### CloudWatch LogGroup Tags

| Tag               | Description                             |
|-------------------|-----------------------------------------|
| autolog:dest      | The destination logs will be written to |

The following destination patterns are supported

| Destination                  | Description                                                                                                                                                      |
|------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| {{bucketName}}/{{indexName}} | Logs will be written to an s3 bucket managed by [overwatch](https://github.com/truemark/overwatch) using the path /autolog/{{indexName}}/{{account}}/{{region}}/ |

