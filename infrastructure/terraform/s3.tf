# Additional S3 buckets for orchestration artifacts
# (Documents bucket already exists)

resource "aws_s3_bucket" "tool_outputs" {
  bucket = "${var.environment}-security-tool-outputs-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${var.environment}-tool-outputs"
  }
}

resource "aws_s3_bucket_versioning" "tool_outputs" {
  bucket = aws_s3_bucket.tool_outputs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tool_outputs" {
  bucket = aws_s3_bucket.tool_outputs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "tool_outputs" {
  bucket = aws_s3_bucket.tool_outputs.id
  
  rule {
    id     = "archive-old-outputs"
    status = "Enabled"
    
    filter {
      prefix = ""  # Apply to all objects
    }
    
    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }
  }
}

resource "aws_s3_bucket" "agent_artifacts" {
  bucket = "${var.environment}-security-agent-artifacts-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${var.environment}-agent-artifacts"
  }
}

resource "aws_s3_bucket_versioning" "agent_artifacts" {
  bucket = aws_s3_bucket.agent_artifacts.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "agent_artifacts" {
  bucket = aws_s3_bucket.agent_artifacts.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "code_repos" {
  bucket = "${var.environment}-security-code-repos-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${var.environment}-code-repos"
  }
}

resource "aws_s3_bucket_versioning" "code_repos" {
  bucket = aws_s3_bucket.code_repos.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "code_repos" {
  bucket = aws_s3_bucket.code_repos.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "code_repos" {
  bucket = aws_s3_bucket.code_repos.id
  
  rule {
    id     = "delete-old-repos"
    status = "Enabled"
    
    filter {
      prefix = ""  # Apply to all objects
    }
    
    expiration {
      days = 7
    }
  }
}

# Data source for current AWS account is defined in main.tf
