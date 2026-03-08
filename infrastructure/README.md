# AWS Multi-Agent Security Orchestration - Infrastructure

Complete Infrastructure-as-Code for deploying AWS orchestration that integrates with your existing Next.js app, Aurora Postgres, and S3 storage.

## 🚀 Quick Start

**New here?** → [START-HERE.md](./START-HERE.md)

**Need commands?** → [DEPLOY-REFERENCE.md](./DEPLOY-REFERENCE.md)

**Want details?** → [INDEX.md](./INDEX.md)

## What This Does

Adds AWS backend to your existing app:
- Lambda functions for AI agents (Reviewer, Implementer, Tester, Reporter)
- Step Functions for workflow orchestration
- DynamoDB for state management
- API Gateway for REST + WebSocket
- EventBridge for event streaming

**Integrates with your existing**:
- ✅ Aurora Postgres (prompts, use cases)
- ✅ S3 bucket (documents)
- ✅ Next.js app (UI)

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.0 installed
3. **AWS CLI** configured with credentials
4. **Existing Resources**:
   - Aurora Postgres cluster (with connection details: host, port, database, username, password)
   - S3 bucket for documents

## 30-Second Deploy

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Aurora credentials and S3 bucket
terraform init
terraform apply
```

## Cost

- **Development**: ~$30-50/month
- **Production**: ~$200-400/month

## Documentation

- **[START-HERE.md](./START-HERE.md)** - Quick entry point ⭐
- **[QUICKSTART.md](./QUICKSTART.md)** - 30-minute deployment guide
- **[DEPLOY-REFERENCE.md](./DEPLOY-REFERENCE.md)** - Command reference
- **[CHECKLIST.md](./CHECKLIST.md)** - Progress tracker
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical details
- **[CHANGES.md](./CHANGES.md)** - Password auth changes
- **[INDEX.md](./INDEX.md)** - Complete documentation index

## File Structure

```
infrastructure/
├── START-HERE.md          ⭐ Start here!
├── terraform/             Infrastructure code
│   ├── main.tf
│   ├── dynamodb.tf
│   ├── s3.tf
│   ├── iam.tf
│   ├── lambda.tf
│   ├── step-functions.tf
│   ├── api-gateway.tf
│   └── eventbridge.tf
├── lambda-example/        Example Lambda code
└── deploy.sh             Deployment script
```

## What Gets Created

### DynamoDB Tables
- `{env}-security-runs`: Run execution state
- `{env}-security-artifacts`: Agent outputs and findings
- `{env}-websocket-connections`: Active WebSocket connections
- `{env}-embedding-cache`: Cached document embeddings

### S3 Buckets
- `{env}-security-tool-outputs-{account}`: Static analysis tool results
- `{env}-security-agent-artifacts-{account}`: Agent-generated patches and reports
- `{env}-security-code-repos-{account}`: Cloned code repositories (7-day retention)

### Lambda Functions
- `{env}-initialize-run`: Creates run and loads configuration
- `{env}-agent-reviewer`: Analyzes findings and prioritizes
- `{env}-agent-implementer`: Generates code patches
- `{env}-agent-tester`: Validates patches
- `{env}-agent-reporter`: Compiles final reports
- `{env}-websocket-*`: WebSocket connection handlers
- `{env}-event-streamer`: Streams events to connected clients

### Step Functions
- `{env}-run-workflow`: Main orchestration state machine

### API Gateway
- REST API: `https://{api-id}.execute-api.{region}.amazonaws.com/{env}`
- WebSocket: `wss://{api-id}.execute-api.{region}.amazonaws.com/{env}`

## Next Steps

### 1. Add Lambda Function Code

The Terraform creates Lambda functions but expects ZIP files in `../lambda/`:

```
infrastructure/
├── lambda/
│   ├── initialize-run.zip
│   ├── agent-reviewer.zip
│   ├── agent-implementer.zip
│   ├── agent-tester.zip
│   ├── agent-reporter.zip
│   ├── websocket-connect.zip
│   ├── websocket-disconnect.zip
│   ├── websocket-message.zip
│   └── event-streamer.zip
└── terraform/
```

Each ZIP should contain:
- `index.py` (or `index.js`) with a `handler` function
- Dependencies (if any)

### 2. Integrate with Your Next.js App

Add API routes to trigger runs:

```javascript
// app/api/runs/route.js
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

export async function POST(request) {
  const { userId, useCaseGroupIds } = await request.json();
  
  const sfn = new SFNClient({ region: process.env.AWS_REGION });
  
  const result = await sfn.send(new StartExecutionCommand({
    stateMachineArn: process.env.STEP_FUNCTIONS_ARN,
    input: JSON.stringify({
      userId,
      groupIds: useCaseGroupIds,
      runId: `run_${Date.now()}_${userId}`
    })
  }));
  
  return Response.json({ runId: result.executionArn });
}
```

### 3. Connect WebSocket for Real-Time Updates

```javascript
// In your React component
const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    runId: currentRunId
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle events: run_started, finding_emitted, etc.
};
```

### 4. Query Run Status

```javascript
// Query DynamoDB for run status
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

const result = await dynamodb.send(new GetItemCommand({
  TableName: process.env.RUNS_TABLE,
  Key: { runId: { S: runId } }
}));
```

## Environment Management

### Multiple Environments

Create separate `.tfvars` files:

```bash
# Development
terraform apply -var-file="dev.tfvars"

# Staging
terraform apply -var-file="staging.tfvars"

# Production
terraform apply -var-file="prod.tfvars"
```

### Terraform Workspaces

```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

terraform workspace select dev
terraform apply
```

## Monitoring

### CloudWatch Dashboards

After deployment, create dashboards to monitor:
- Lambda execution duration and errors
- Step Functions execution status
- DynamoDB read/write capacity
- API Gateway request count and latency

### Alarms

Set up CloudWatch Alarms for:
- Lambda error rate > 5%
- Step Functions failed executions
- DynamoDB throttling
- API Gateway 5xx errors

## Troubleshooting

### Lambda Function Fails

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/{env}-agent-reviewer --follow
```

### Step Functions Execution Fails

View execution history:
```bash
aws stepfunctions describe-execution --execution-arn {arn}
```

### WebSocket Connection Issues

Check API Gateway logs:
```bash
aws logs tail /aws/apigateway/{env}-orchestrator --follow
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all DynamoDB tables, S3 buckets, and Lambda functions. Make sure to backup any important data first.

## Security Best Practices

1. **Secrets Management**: Store all sensitive data in AWS Secrets Manager
2. **IAM Policies**: Use least-privilege access (already configured)
3. **Encryption**: All data encrypted at rest and in transit
4. **VPC**: Consider deploying Lambda functions in VPC for additional isolation
5. **API Authentication**: Add JWT validation to API Gateway (not included in this basic setup)

## Support

For issues or questions:
1. Check CloudWatch Logs for errors
2. Review Terraform plan output
3. Verify AWS service quotas
4. Check IAM permissions

## License

[Your License]
