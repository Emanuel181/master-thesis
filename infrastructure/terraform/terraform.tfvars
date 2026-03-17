environment         = "dev"
aws_region          = "us-east-1"
existing_s3_bucket  = "vulniq-bucket-dev"
aurora_host         = "vulniq-db-dev.ckz6aqg6853e.us-east-1.rds.amazonaws.com"
aurora_database     = "vulniq-db-de"
aurora_username     = "postgres"
aurora_password     = "jgk9nH4EWwhnatNQ31ss"
bedrock_model_id    = "anthropic.claude-3-sonnet-20240229-v1:0"

# ─── Pentester EC2 Agent ──────────────────────────────────
pentester_instance_type = "t3.large"
pentester_vpc_id        = "vpc-0a9439d825e64aa17"
pentester_subnet_id     = "subnet-0fed8d8e9ddd38f7c"

