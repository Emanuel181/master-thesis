# DynamoDB tables for run state and artifacts
# (Prompts and use cases stay in Aurora)

resource "aws_dynamodb_table" "runs" {
  name           = "${var.environment}-security-runs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "runId"
  
  attribute {
    name = "runId"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  attribute {
    name = "createdAt"
    type = "S"
  }
  
  global_secondary_index {
    name            = "userId-status-index"
    hash_key        = "userId"
    range_key       = "status"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "userId-createdAt-index"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name = "${var.environment}-security-runs"
  }
}

resource "aws_dynamodb_table" "artifacts" {
  name           = "${var.environment}-security-artifacts"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "artifactId"
  
  attribute {
    name = "artifactId"
    type = "S"
  }
  
  attribute {
    name = "runId"
    type = "S"
  }
  
  attribute {
    name = "type"
    type = "S"
  }
  
  global_secondary_index {
    name            = "runId-type-index"
    hash_key        = "runId"
    range_key       = "type"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name = "${var.environment}-security-artifacts"
  }
}

resource "aws_dynamodb_table" "websocket_connections" {
  name           = "${var.environment}-websocket-connections"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "connectionId"
  
  attribute {
    name = "connectionId"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }
  
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name = "${var.environment}-websocket-connections"
  }
}

resource "aws_dynamodb_table" "embedding_cache" {
  name           = "${var.environment}-embedding-cache"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "documentId"
  
  attribute {
    name = "documentId"
    type = "S"
  }
  
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name = "${var.environment}-embedding-cache"
  }
}
