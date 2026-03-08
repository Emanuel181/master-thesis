#!/bin/bash

# Fix OpenSearch index using only boto3 (no additional packages needed)

set -e

echo "========================================="
echo "Creating OpenSearch Index"
echo "========================================="
echo ""

cd terraform

# Get the OpenSearch endpoint
OPENSEARCH_ENDPOINT=$(terraform output -raw opensearch_collection_endpoint 2>/dev/null || echo "")

if [ -z "$OPENSEARCH_ENDPOINT" ]; then
    echo "Error: Could not get OpenSearch endpoint from Terraform"
    exit 1
fi

echo "OpenSearch Endpoint: $OPENSEARCH_ENDPOINT"
echo "Region: us-east-1"
echo ""

# Create the index using boto3 only
echo "Creating index 'document-embeddings'..."
python3 ../create-index-boto3.py "$OPENSEARCH_ENDPOINT" "us-east-1"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "Retrying Terraform Apply"
    echo "========================================="
    echo ""
    terraform apply -auto-approve
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================="
        echo "✓ Deployment Complete!"
        echo "========================================="
    fi
else
    echo ""
    echo "✗ Failed to create index"
    echo ""
    echo "Please check:"
    echo "1. AWS credentials are valid"
    echo "2. IAM permissions for OpenSearch Serverless"
    echo "3. Collection is in ACTIVE state"
    exit 1
fi
