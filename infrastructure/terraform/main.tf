# AWS Multi-Agent Security Orchestration - Terraform Configuration
# This integrates with existing Aurora Postgres and S3 infrastructure

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Using local backend for now - state stored locally
  # backend "s3" {
  #   # Configure this with your own S3 bucket for Terraform state
  #   # bucket = "your-terraform-state-bucket"
  #   # key    = "security-orchestrator/terraform.tfstate"
  #   # region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "SecurityOrchestrator"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aurora_host" {
  description = "Aurora Postgres cluster endpoint"
  type        = string
}

variable "aurora_port" {
  description = "Aurora Postgres port"
  type        = number
  default     = 5432
}

variable "aurora_database" {
  description = "Aurora Postgres database name"
  type        = string
}

variable "aurora_username" {
  description = "Aurora Postgres username"
  type        = string
}

variable "aurora_password" {
  description = "Aurora Postgres password"
  type        = string
  sensitive   = true
}

variable "existing_s3_bucket" {
  description = "Existing S3 bucket name for documents"
  type        = string
}

variable "bedrock_model_id" {
  description = "Bedrock model ID to use"
  type        = string
  default     = "anthropic.claude-3-sonnet-20240229-v1:0"
}

# Data sources for existing resources
data "aws_s3_bucket" "documents" {
  bucket = var.existing_s3_bucket
}

data "aws_caller_identity" "current" {}

# Create Secrets Manager secret for Aurora credentials
resource "aws_secretsmanager_secret" "aurora_credentials" {
  name        = "${var.environment}-aurora-credentials"
  description = "Aurora Postgres credentials for Security Orchestrator"
  
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  secret_id = aws_secretsmanager_secret.aurora_credentials.id
  secret_string = jsonencode({
    host     = var.aurora_host
    port     = var.aurora_port
    dbname   = var.aurora_database
    username = var.aurora_username
    password = var.aurora_password
  })
}

# Outputs
output "run_workflow_api_endpoint" {
  description = "API endpoint to trigger workflow runs"
  value       = aws_apigatewayv2_api.orchestrator.api_endpoint
}

output "websocket_api_endpoint" {
  description = "WebSocket endpoint for real-time updates"
  value       = aws_apigatewayv2_api.websocket.api_endpoint
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.run_workflow.arn
}

output "aurora_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Aurora credentials"
  value       = aws_secretsmanager_secret.aurora_credentials.arn
}

output "agent_artifacts_bucket" {
  description = "S3 bucket for agent artifacts"
  value       = aws_s3_bucket.agent_artifacts.id
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "opensearch_collection_endpoint" {
  description = "OpenSearch Serverless collection endpoint"
  value       = aws_opensearchserverless_collection.rag_vectors.collection_endpoint
}

# Temporarily disabled - uncomment when KB is enabled
# output "knowledge_base_id" {
#   description = "Bedrock Knowledge Base ID"
#   value       = aws_bedrockagent_knowledge_base.documents.id
# }
# 
# output "data_source_id" {
#   description = "Bedrock Data Source ID"
#   value       = aws_bedrockagent_data_source.documents.id
# }
