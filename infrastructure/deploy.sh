#!/bin/bash
# Deployment script for AWS Security Orchestration Infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"

echo -e "${GREEN}=== AWS Security Orchestration Deployment ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Check if terraform.tfvars exists
if [ ! -f "${TERRAFORM_DIR}/terraform.tfvars" ]; then
    echo -e "${RED}Error: terraform.tfvars not found${NC}"
    echo "Please copy terraform.tfvars.example to terraform.tfvars and configure it"
    exit 1
fi

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
cd ${TERRAFORM_DIR}
terraform init

# Select or create workspace
echo -e "${YELLOW}Setting up Terraform workspace: ${ENVIRONMENT}${NC}"
terraform workspace select ${ENVIRONMENT} 2>/dev/null || terraform workspace new ${ENVIRONMENT}

# Validate configuration
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
terraform validate
# Plan
echo -e "${YELLOW}Creating Terraform plan...${NC}"
terraform plan -out=tfplan

# Ask for confirmation
echo ""
echo -e "${YELLOW}Ready to apply changes. Continue? (yes/no)${NC}"
read -r response

if [ "$response" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    rm -f tfplan
    exit 0
fi

# Apply
echo -e "${GREEN}Applying Terraform changes...${NC}"
terraform apply tfplan
rm -f tfplan

# Get outputs
echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo -e "${YELLOW}API Endpoints:${NC}"
terraform output run_workflow_api_endpoint
terraform output websocket_api_endpoint

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Add Lambda function code to ../lambda/"
echo "2. Update Lambda functions with: ./update-lambdas.sh"
echo "3. Configure your Next.js app with the API endpoints"
echo "4. Test the WebSocket connection"

cd ..
