# @streamyy/dynamodb

DynamoDB persistence adapter for Streamyy.

## Install

```bash
npm install @streamyy/server @streamyy/dynamodb @aws-sdk/lib-dynamodb
```

## Usage

```ts
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createDynamoDbPersistenceAdapter } from "@streamyy/dynamodb";
import { createStreammyServer } from "@streamyy/server";

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
