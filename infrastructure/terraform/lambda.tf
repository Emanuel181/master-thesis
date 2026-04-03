# Lambda functions for agents and orchestration
# Note: Function code should be in ../lambda/ directory

# Placeholder Lambda functions - you'll need to add the actual code

resource "aws_lambda_function" "initialize_run" {
  filename      = "../lambda/initialize-run.zip"
  function_name = "${var.environment}-initialize-run"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 60
  memory_size   = 512
  
  environment {
    variables = {
      ENVIRONMENT           = var.environment
      RUNS_TABLE            = aws_dynamodb_table.runs.name
      AURORA_SECRET_ARN     = aws_secretsmanager_secret.aurora_credentials.arn
      DOCUMENTS_BUCKET      = data.aws_s3_bucket.documents.id
      CODE_REPOS_BUCKET     = aws_s3_bucket.code_repos.id
    }
  }
  
  tags = {
    Name = "${var.environment}-initialize-run"
  }
}

resource "aws_lambda_function" "agent_reviewer" {
  filename      = "../lambda/agent-reviewer.zip"
  function_name = "${var.environment}-agent-reviewer"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 900  # 15 minutes
  memory_size   = 2048

  environment {
    variables = {
      ENVIRONMENT           = var.environment
      RUNS_TABLE            = aws_dynamodb_table.runs.name
      ARTIFACTS_TABLE       = aws_dynamodb_table.artifacts.name
      AURORA_SECRET_ARN     = aws_secretsmanager_secret.aurora_credentials.arn
      DOCUMENTS_BUCKET      = data.aws_s3_bucket.documents.id
      TOOL_OUTPUTS_BUCKET   = aws_s3_bucket.tool_outputs.id
      AGENT_ARTIFACTS_BUCKET = aws_s3_bucket.agent_artifacts.id
      BEDROCK_MODEL_ID      = var.bedrock_model_id
      EVENT_BUS_NAME        = aws_cloudwatch_event_bus.orchestrator.name
      # AWS_REGION is automatically available in Lambda - no need to set it
      # KNOWLEDGE_BASE_ID temporarily disabled - will be added when RAG is enabled
    }
  }

  tags = {
    Name = "${var.environment}-agent-reviewer"
  }
}

resource "aws_lambda_function" "agent_fixer" {
  filename      = "../lambda/agent-fixer.zip"
  function_name = "${var.environment}-agent-fixer"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 900  # 15 minutes
  memory_size   = 2048

  environment {
    variables = {
      ENVIRONMENT            = var.environment
      AWS_S3_BUCKET_NAME     = aws_s3_bucket.agent_artifacts.id
      CODE_BUCKET            = aws_s3_bucket.code_repos.id
    }
  }

  tags = {
    Name = "${var.environment}-agent-fixer"
  }
}

resource "aws_lambda_function" "agent_implementer" {
  filename      = "../lambda/agent-implementer.zip"
  function_name = "${var.environment}-agent-implementer"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 900
  memory_size   = 2048
  
  environment {
    variables = {
      ENVIRONMENT           = var.environment
      RUNS_TABLE            = aws_dynamodb_table.runs.name
      ARTIFACTS_TABLE       = aws_dynamodb_table.artifacts.name
      AURORA_SECRET_ARN     = aws_secretsmanager_secret.aurora_credentials.arn
      AGENT_ARTIFACTS_BUCKET = aws_s3_bucket.agent_artifacts.id
      BEDROCK_MODEL_ID      = var.bedrock_model_id
      EVENT_BUS_NAME        = aws_cloudwatch_event_bus.orchestrator.name
      DATABASE_URL          = "postgresql://${var.aurora_username}:${var.aurora_password}@${var.aurora_host}:${var.aurora_port}/${var.aurora_database}?sslmode=require"
    }
  }
  
  tags = {
    Name = "${var.environment}-agent-implementer"
  }
}

resource "aws_lambda_function" "agent_tester" {
  filename      = "../lambda/agent-tester.zip"
  function_name = "${var.environment}-agent-tester"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 900  # 15 minutes (AWS Lambda maximum)
  memory_size   = 2048
  
  environment {
    variables = {
      ENVIRONMENT            = var.environment
      RUNS_TABLE             = aws_dynamodb_table.runs.name
      ARTIFACTS_TABLE        = aws_dynamodb_table.artifacts.name
      AGENT_ARTIFACTS_BUCKET = aws_s3_bucket.agent_artifacts.id
      BEDROCK_MODEL_ID       = var.bedrock_model_id
      EVENT_BUS_NAME         = aws_cloudwatch_event_bus.orchestrator.name
      TESTER_FUNCTION_NAME   = "${var.environment}-agent-tester"
    }
  }
  
  tags = {
    Name = "${var.environment}-agent-tester"
  }
}

resource "aws_lambda_function" "agent_reporter" {
  filename      = "../lambda/agent-reporter.zip"
  function_name = "${var.environment}-agent-reporter"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 600
  memory_size   = 2048

  environment {
    variables = {
      ENVIRONMENT           = var.environment
      RUNS_TABLE            = aws_dynamodb_table.runs.name
      ARTIFACTS_TABLE       = aws_dynamodb_table.artifacts.name
      AGENT_ARTIFACTS_BUCKET = aws_s3_bucket.agent_artifacts.id
      BEDROCK_MODEL_ID      = var.bedrock_model_id
      EVENT_BUS_NAME        = aws_cloudwatch_event_bus.orchestrator.name
    }
  }

  tags = {
    Name = "${var.environment}-agent-reporter"
  }
}

# Autonomous Pentest Bridge Lambda (Node.js)
resource "aws_lambda_function" "agent_tester_pentest" {
  filename      = "../lambda/agent-tester-pentest.zip"
  function_name = "${var.environment}-agent-tester-pentest"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 900  # 15 minutes (Lambda will start pentest and return, not wait for completion)
  memory_size   = 1024

  environment {
    variables = {
      ENVIRONMENT                = var.environment
      PENTEST_STATE_MACHINE_ARN  = "arn:aws:states:us-east-1:650080740856:stateMachine:vulniq-pentest-orchestrator"
      PENTEST_CODE_BUCKET        = "vulniq-pentest-code-650080740856"
      PENTEST_RESULTS_BUCKET     = "vulniq-pentest-results-650080740856"
      PENTEST_SESSIONS_TABLE     = "PentestSessions"
      PENTEST_FINDINGS_TABLE     = "PentestFindings"
      EVENT_BUS_NAME             = aws_cloudwatch_event_bus.orchestrator.name
    }
  }

  tags = {
    Name = "${var.environment}-agent-tester-pentest"
  }
}

# WebSocket Lambda functions
resource "aws_lambda_function" "websocket_connect" {
  filename      = "../lambda/websocket-connect.zip"
  function_name = "${var.environment}-websocket-connect"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256
  
  environment {
    variables = {
      ENVIRONMENT        = var.environment
      CONNECTIONS_TABLE  = aws_dynamodb_table.websocket_connections.name
    }
  }
  
  tags = {
    Name = "${var.environment}-websocket-connect"
  }
}

resource "aws_lambda_function" "websocket_disconnect" {
  filename      = "../lambda/websocket-disconnect.zip"
  function_name = "${var.environment}-websocket-disconnect"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256
  
  environment {
    variables = {
      ENVIRONMENT        = var.environment
      CONNECTIONS_TABLE  = aws_dynamodb_table.websocket_connections.name
    }
  }
  
  tags = {
    Name = "${var.environment}-websocket-disconnect"
  }
}

resource "aws_lambda_function" "websocket_message" {
  filename      = "../lambda/websocket-message.zip"
  function_name = "${var.environment}-websocket-message"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256
  
  environment {
    variables = {
      ENVIRONMENT        = var.environment
      CONNECTIONS_TABLE  = aws_dynamodb_table.websocket_connections.name
      RUNS_TABLE         = aws_dynamodb_table.runs.name
    }
  }
  
  tags = {
    Name = "${var.environment}-websocket-message"
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "websocket_connect" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.websocket_connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "websocket_disconnect" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.websocket_disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "websocket_message" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.websocket_message.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}
