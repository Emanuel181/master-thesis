# IAM roles and policies for Lambda functions and Step Functions

# Lambda execution role for agent functions
resource "aws_iam_role" "agent_lambda" {
  name = "${var.environment}-agent-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "agent_lambda" {
  name = "${var.environment}-agent-lambda-policy"
  role = aws_iam_role.agent_lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.runs.arn,
          "${aws_dynamodb_table.runs.arn}/index/*",
          aws_dynamodb_table.artifacts.arn,
          "${aws_dynamodb_table.artifacts.arn}/index/*",
          aws_dynamodb_table.embedding_cache.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${data.aws_s3_bucket.documents.arn}/*",
          "${aws_s3_bucket.tool_outputs.arn}/*",
          "${aws_s3_bucket.agent_artifacts.arn}/*",
          "${aws_s3_bucket.code_repos.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:Retrieve",
          "bedrock:RetrieveAndGenerate"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.aurora_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = aws_cloudwatch_event_bus.orchestrator.arn
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.environment}-agent-*"
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution",
          "states:DescribeExecution"
        ]
        Resource = "arn:aws:states:${var.aws_region}:${data.aws_caller_identity.current.account_id}:stateMachine:vulniq-pentest-orchestrator"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/PentestSessions",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/PentestFindings",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/PentestFindings/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::vulniq-pentest-code-${data.aws_caller_identity.current.account_id}/*",
          "arn:aws:s3:::vulniq-pentest-results-${data.aws_caller_identity.current.account_id}/*"
        ]
      }
    ]
  })
}

# Step Functions execution role
resource "aws_iam_role" "step_functions" {
  name = "${var.environment}-step-functions-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${var.environment}-step-functions-policy"
  role = aws_iam_role.step_functions.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.environment}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask",
          "ecs:StopTask",
          "ecs:DescribeTasks"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = aws_iam_role.ecs_task.arn
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutTargets",
          "events:PutRule",
          "events:DescribeRule",
          "events:PutEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.pentester_jobs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECS task execution role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.environment}-ecs-task-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS task role (for tool containers)
resource "aws_iam_role" "ecs_task" {
  name = "${var.environment}-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.environment}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.code_repos.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.tool_outputs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = aws_cloudwatch_event_bus.orchestrator.arn
      }
    ]
  })
}

# API Gateway execution role for WebSocket
resource "aws_iam_role" "apigateway_websocket" {
  name = "${var.environment}-apigateway-websocket-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "apigateway_websocket" {
  name = "${var.environment}-apigateway-websocket-policy"
  role = aws_iam_role.apigateway_websocket.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.environment}-websocket-*"
      }
    ]
  })
}
