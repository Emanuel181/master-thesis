#!/bin/bash

# RAG-Enabled Workflow Setup Script
# This script sets up the complete infrastructure for the agentic workflow

set -e

echo "========================================="
echo "RAG-Enabled Workflow Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    echo "Install from: https://www.terraform.io/downloads"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Warning: Node.js is not installed${NC}"
    echo "Skipping Node.js-dependent steps (migrations, Prisma)"
    SKIP_NODE=true
else
    SKIP_NODE=false
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials configured (Account: $AWS_ACCOUNT_ID)${NC}"
echo ""

# Get configuration from user
echo "Configuration:"
echo "-------------"

read -p "Environment name (dev/staging/prod) [dev]: " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-dev}

read -p "AWS Region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "Existing S3 bucket for documents: " S3_BUCKET
if [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}Error: S3 bucket name is required${NC}"
    exit 1
fi

read -p "Aurora Postgres host: " AURORA_HOST
if [ -z "$AURORA_HOST" ]; then
    echo -e "${RED}Error: Aurora host is required${NC}"
    exit 1
fi

read -p "Aurora database name: " AURORA_DATABASE
if [ -z "$AURORA_DATABASE" ]; then
    echo -e "${RED}Error: Aurora database name is required${NC}"
    exit 1
fi

read -p "Aurora username: " AURORA_USERNAME
if [ -z "$AURORA_USERNAME" ]; then
    echo -e "${RED}Error: Aurora username is required${NC}"
    exit 1
fi

read -sp "Aurora password: " AURORA_PASSWORD
echo ""
if [ -z "$AURORA_PASSWORD" ]; then
    echo -e "${RED}Error: Aurora password is required${NC}"
    exit 1
fi

read -p "Bedrock model ID [anthropic.claude-3-sonnet-20240229-v1:0]: " BEDROCK_MODEL
BEDROCK_MODEL=${BEDROCK_MODEL:-anthropic.claude-3-sonnet-20240229-v1:0}

echo ""
echo "Configuration Summary:"
echo "---------------------"
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "S3 Bucket: $S3_BUCKET"
echo "Aurora Host: $AURORA_HOST"
echo "Aurora Database: $AURORA_DATABASE"
echo "Bedrock Model: $BEDROCK_MODEL"
echo ""

read -p "Proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

# Create terraform.tfvars
echo ""
echo "Creating Terraform configuration..."
cd terraform

cat > terraform.tfvars <<EOF
environment         = "$ENVIRONMENT"
aws_region          = "$AWS_REGION"
existing_s3_bucket  = "$S3_BUCKET"
aurora_host         = "$AURORA_HOST"
aurora_database     = "$AURORA_DATABASE"
aurora_username     = "$AURORA_USERNAME"
aurora_password     = "$AURORA_PASSWORD"
bedrock_model_id    = "$BEDROCK_MODEL"
EOF

echo -e "${GREEN}✓ Terraform configuration created${NC}"

# Initialize Terraform
echo ""
echo "Initializing Terraform..."
terraform init

# Plan deployment
echo ""
echo "Planning deployment..."
terraform plan -out=tfplan

# Apply deployment
echo ""
read -p "Apply Terraform plan? (yes/no): " APPLY_CONFIRM
if [ "$APPLY_CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Deploying infrastructure..."
terraform apply tfplan

# Get outputs
echo ""
echo "Retrieving deployment outputs..."
STEP_FUNCTIONS_ARN=$(terraform output -raw step_functions_arn)
KNOWLEDGE_BASE_ID=$(terraform output -raw knowledge_base_id)
DATA_SOURCE_ID=$(terraform output -raw data_source_id)
OPENSEARCH_ENDPOINT=$(terraform output -raw opensearch_collection_endpoint)
WEBSOCKET_ENDPOINT=$(terraform output -raw websocket_api_endpoint)
API_ENDPOINT=$(terraform output -raw run_workflow_api_endpoint)

echo -e "${GREEN}✓ Infrastructure deployed successfully${NC}"

# Create .env file
echo ""
echo "Creating environment configuration..."
cd ../..

cat >> .env.local <<EOF

# RAG Workflow Configuration (Added $(date))
AWS_REGION=$AWS_REGION
STEP_FUNCTIONS_ARN=$STEP_FUNCTIONS_ARN
BEDROCK_KNOWLEDGE_BASE_ID=$KNOWLEDGE_BASE_ID
BEDROCK_DATA_SOURCE_ID=$DATA_SOURCE_ID
OPENSEARCH_ENDPOINT=$OPENSEARCH_ENDPOINT
WEBSOCKET_ENDPOINT=$WEBSOCKET_ENDPOINT
API_ENDPOINT=$API_ENDPOINT
EOF

echo -e "${GREEN}✓ Environment configuration updated${NC}"

# Package Lambda functions
echo ""
echo "Packaging Lambda functions..."
cd infrastructure

# Create lambda packages directory
mkdir -p lambda-packages

# Package each Lambda function
for lambda_dir in lambda/*/; do
    lambda_name=$(basename "$lambda_dir")
    echo "Packaging $lambda_name..."
    
    cd "$lambda_dir"
    
    # Install dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt -t .
    fi
    
    # Create zip
    zip -r "../../lambda-packages/${lambda_name}.zip" . -x "*.pyc" -x "__pycache__/*"
    
    cd ../..
done

echo -e "${GREEN}✓ Lambda functions packaged${NC}"

# Deploy Lambda functions
echo ""
echo "Deploying Lambda functions..."

for lambda_zip in lambda-packages/*.zip; do
    lambda_name=$(basename "$lambda_zip" .zip)
    function_name="${ENVIRONMENT}-${lambda_name}"
    
    echo "Deploying $function_name..."
    
    aws lambda update-function-code \
        --function-name "$function_name" \
        --zip-file "fileb://$lambda_zip" \
        --region "$AWS_REGION" \
        > /dev/null
done

echo -e "${GREEN}✓ Lambda functions deployed${NC}"

# Run database migrations
if [ "$SKIP_NODE" = false ]; then
    echo ""
    echo "Running database migrations..."
    cd ..
    npx prisma migrate deploy

    echo -e "${GREEN}✓ Database migrations completed${NC}"

    # Generate Prisma client
    echo ""
    echo "Generating Prisma client..."
    npx prisma generate

    echo -e "${GREEN}✓ Prisma client generated${NC}"
else
    echo ""
    echo -e "${YELLOW}Skipping database migrations (Node.js not available)${NC}"
    echo "Run these commands manually from your Windows environment:"
    echo "  npx prisma migrate deploy"
    echo "  npx prisma generate"
fi

# Summary
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Infrastructure Details:"
echo "----------------------"
echo "Step Functions ARN: $STEP_FUNCTIONS_ARN"
echo "Knowledge Base ID: $KNOWLEDGE_BASE_ID"
echo "Data Source ID: $DATA_SOURCE_ID"
echo "OpenSearch Endpoint: $OPENSEARCH_ENDPOINT"
echo "WebSocket Endpoint: $WEBSOCKET_ENDPOINT"
echo "API Endpoint: $API_ENDPOINT"
echo ""
echo "Next Steps:"
echo "----------"
echo "1. Upload documents to S3 bucket: $S3_BUCKET"
echo "2. Start the Next.js development server: npm run dev"
echo "3. Navigate to /dashboard/workflow-configuration"
echo "4. Configure agents and select documents"
echo "5. Start a workflow run"
echo ""
echo "Documentation:"
echo "-------------"
echo "See RAG-WORKFLOW-GUIDE.md for detailed usage instructions"
echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"
