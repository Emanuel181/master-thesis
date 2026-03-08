#!/bin/bash

# Fix OpenSearch index issue
# This script creates the index manually and then retries Terraform

set -e

echo "========================================="
echo "Fixing OpenSearch Index Issue"
echo "========================================="
echo ""

# Get the OpenSearch endpoint from Terraform
cd terraform
OPENSEARCH_ENDPOINT=$(terraform output -raw opensearch_collection_endpoint 2>/dev/null || echo "")

if [ -z "$OPENSEARCH_ENDPOINT" ]; then
    echo "Error: Could not get OpenSearch endpoint from Terraform"
    echo "The collection was created but we need its endpoint"
    exit 1
fi

echo "OpenSearch Endpoint: $OPENSEARCH_ENDPOINT"
echo ""

# Install opensearch-py if not already installed
echo "Installing opensearch-py..."
pip3 install opensearch-py --break-system-packages --quiet 2>/dev/null || pip install opensearch-py --break-system-packages --quiet 2>/dev/null || echo "Using existing installation"

echo "Creating OpenSearch index..."
python3 ../create-opensearch-index.py "$OPENSEARCH_ENDPOINT" "us-east-1"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Index created successfully"
    echo ""
    echo "Retrying Terraform apply..."
    terraform apply -auto-approve
else
    echo ""
    echo "✗ Failed to create index"
    exit 1
fi
