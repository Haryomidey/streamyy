# @streammy/dynamodb

DynamoDB persistence adapter for Streamyy.

## Install

```bash
npm install @streammy/server @streammy/dynamodb @aws-sdk/lib-dynamodb
```

## Usage

```ts
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createDynamoDbPersistenceAdapter } from "@streammy/dynamodb";
import { createStreammyServer } from "@streammy/server";

const dynamo = DynamoDBDocumentClient.from(baseClient);

const streammy = createStreammyServer({
  httpServer,
  persistence: createDynamoDbPersistenceAdapter({
    client: dynamo,
  }),
});
```

## Good fit

- AWS-native deployments
- serverless backends
- horizontally scalable metadata storage