#!/bin/bash

# Simple fix using AWS CLI to create the index
# No Python dependencies required

set -e

echo "========================================="
echo "Fixing OpenSearch Index (Simple Method)"
echo "========================================="
echo ""

cd terraform

# Get the OpenSearch endpoint
OPENSEARCH_ENDPOINT=$(terraform output -raw opensearch_collection_endpoint 2>/dev/null || echo "")

if [ -z "$OPENSEARCH_ENDPOINT" ]; then
    echo "Error: Could not get OpenSearch endpoint"
    exit 1
fi

echo "OpenSearch Endpoint: $OPENSEARCH_ENDPOINT"
echo ""

# Extract host from endpoint
HOST=$(echo $OPENSEARCH_ENDPOINT | sed 's|https://||')

# Create index using AWS CLI with SigV4 signing
echo "Creating index 'document-embeddings'..."

# Index configuration
INDEX_CONFIG='{
  "settings": {
    "index": {
      "knn": true,
      "knn.algo_param.ef_search": 512
    }
  },
  "mappings": {
    "properties": {
      "embedding": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "engine": "faiss",
          "parameters": {
            "ef_construction": 512,
            "m": 16
          }
        }
      },
      "AMAZON_BEDROCK_TEXT_CHUNK": {
        "type": "text"
      },
      "AMAZON_BEDROCK_METADATA": {
        "type": "text",
        "index": false
      }
    }
  }
}'

# Use awscurl if available, otherwise use aws opensearch command
if command -v awscurl &> /dev/null; then
    awscurl --service aoss --region us-east-1 \
        -X PUT \
        -H "Content-Type: application/json" \
        -d "$INDEX_CONFIG" \
        "${OPENSEARCH_ENDPOINT}/document-embeddings"
else
    # Alternative: Use Python with boto3 (already installed for AWS CLI)
    python3 << 'PYTHON_SCRIPT'
import boto3
import json
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import urllib3

# Configuration
endpoint = "$OPENSEARCH_ENDPOINT"
index_name = "document-embeddings"
region = "us-east-1"

# Index configuration
index_config = {
    "settings": {
        "index": {
            "knn": True,
            "knn.algo_param.ef_search": 512
        }
    },
    "mappings": {
        "properties": {
            "embedding": {
                "type": "knn_vector",
                "dimension": 1024,
                "method": {
                    "name": "hnsw",
                    "engine": "faiss",
                    "parameters": {
                        "ef_construction": 512,
                        "m": 16
                    }
                }
            },
            "AMAZON_BEDROCK_TEXT_CHUNK": {
                "type": "text"
            },
            "AMAZON_BEDROCK_METADATA": {
                "type": "text",
                "index": False
            }
        }
    }
}

# Get credentials
session = boto3.Session()
credentials = session.get_credentials()

# Create request
url = f"{endpoint}/{index_name}"
headers = {"Content-Type": "application/json"}
body = json.dumps(index_config)

request = AWSRequest(method="PUT", url=url, data=body, headers=headers)
SigV4Auth(credentials, "aoss", region).add_auth(request)

# Send request
http = urllib3.PoolManager()
response = http.request(
    request.method,
    request.url,
    body=request.body,
    headers=dict(request.headers)
)

print(f"Status: {response.status}")
print(f"Response: {response.data.decode('utf-8')}")

if response.status in [200, 201]:
    print("✓ Index created successfully")
    exit(0)
else:
    print("✗ Failed to create index")
    exit(1)
PYTHON_SCRIPT
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Index created successfully"
    echo ""
    echo "Retrying Terraform apply..."
    terraform apply -auto-approve
else
    echo ""
    echo "✗ Failed to create index"
    echo ""
    echo "Manual steps:"
    echo "1. Go to AWS Console > OpenSearch Service > Serverless collections"
    echo "2. Click on 'dev-rag-vectors'"
    echo "3. Use the OpenSearch Dashboards to create index 'document-embeddings'"
    echo "4. Then run: cd terraform && terraform apply"
    exit 1
fi
