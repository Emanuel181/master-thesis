# EventBridge for event-driven orchestration and streaming

resource "aws_cloudwatch_event_bus" "orchestrator" {
  name = "${var.environment}-security-orchestrator"
  
  tags = {
    Name = "${var.environment}-orchestrator-event-bus"
  }
}

# Event rule to stream events to WebSocket connections
resource "aws_cloudwatch_event_rule" "stream_to_websocket" {
  name           = "${var.environment}-stream-to-websocket"
  description    = "Stream workflow events to WebSocket connections"
  event_bus_name = aws_cloudwatch_event_bus.orchestrator.name
  
  event_pattern = jsonencode({
    source = ["orchestrator"]
    detail-type = [
      "run_started",
      "run_finished",
      "run_failed",
      "usecase_started",
      "usecase_finished",
      "tool_started",
      "tool_finished",
      "finding_emitted",
      "patch_proposed",
      "tests_run",
      "report_ready"
    ]
  })
  
  tags = {
    Name = "${var.environment}-stream-to-websocket-rule"
  }
}

resource "aws_cloudwatch_event_target" "stream_to_websocket" {
  rule           = aws_cloudwatch_event_rule.stream_to_websocket.name
  event_bus_name = aws_cloudwatch_event_bus.orchestrator.name
  arn            = aws_lambda_function.event_streamer.arn
}

# Lambda function to stream events to WebSocket
resource "aws_lambda_function" "event_streamer" {
  filename      = "../lambda/event-streamer.zip"
  function_name = "${var.environment}-event-streamer"
  role          = aws_iam_role.agent_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256
  
  environment {
    variables = {
      ENVIRONMENT        = var.environment
      CONNECTIONS_TABLE  = aws_dynamodb_table.websocket_connections.name
      WEBSOCKET_API_ENDPOINT = aws_apigatewayv2_stage.websocket.invoke_url
    }
  }
  
  tags = {
    Name = "${var.environment}-event-streamer"
  }
}

resource "aws_lambda_permission" "event_streamer" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_streamer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.stream_to_websocket.arn
}

# IAM policy for event streamer to post to WebSocket
resource "aws_iam_role_policy" "event_streamer_websocket" {
  name = "${var.environment}-event-streamer-websocket-policy"
  role = aws_iam_role.agent_lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "execute-api:ManageConnections"
        ]
        Resource = "${aws_apigatewayv2_api.websocket.execution_arn}/*"
      }
    ]
  })
}
