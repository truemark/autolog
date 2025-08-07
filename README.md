# AutoLog

AWS CDK deployed stack that allows you to manipulate and ship AWS CloudWatch logs through tags.

## Installation

1. Install Node version 20. The use of nvm is recommended. See https://github.com/nvm-sh/nvm
2. Install AWS CDK. See https://docs.aws.amazon.com/cdk/latest/guide/work-with-cdk-typescript.html
3. Set the AWS_REGION environment variable and credentials in your terminal or alternatively use AWS_PROFILE.

4. Run a diff
    ```bash
   pnpm cdk-diff
    ```
   
5. Deploy the stack
    ```bash
    pnpm cdk-deploy
     ```


## Supported Tags

### CloudWatch LogGroup Tags

| Tag               | Description                             |
|-------------------|-----------------------------------------|
| autolog:dest      | The destination logs will be written to |
| autolog:disabled      | If set to true, AutoLog will skip creating or delete existing logs subscription filter |

The following destination patterns are supported

| Destination                  | Description                                                                                                                                                      |
|------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| {{bucketName}}/{{indexName}} | Logs will be written to an s3 bucket managed by [overwatch](https://github.com/truemark/overwatch) using the path /autolog/{{indexName}}/{{account}}/{{region}}/ |

