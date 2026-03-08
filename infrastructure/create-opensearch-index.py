#!/usr/bin/env python3
"""
Create OpenSearch Serverless index for Bedrock Knowledge Base
This must be run before creating the Knowledge Base
"""
import boto3
import json
import sys
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

def create_index(collection_endpoint, region):
    """Create the vector index in OpenSearch Serverless"""
    
    # Get AWS credentials
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, region, 'aoss')
    
    # Remove https:// from endpoint if present
    host = collection_endpoint.replace('https://', '')
    
    # Create OpenSearch client
    client = OpenSearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=300
    )
    
    # Index configuration for Bedrock Knowledge Base
    index_name = 'document-embeddings'
    index_body = {
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
                    "dimension": 1024,  # Titan Embeddings v2 dimension
                    "method": {
                        "name": "hnsw",
                        "engine": "faiss",
                        "parameters": {
                            "ef_construction": 512,
                            "m": 16
                        }
                    }
                },
                "text": {
                    "type": "text"
                },
                "metadata": {
                    "type": "text"
                },
                "AMAZON_BEDROCK_METADATA": {
                    "type": "text",
                    "index": False
                },
                "AMAZON_BEDROCK_TEXT_CHUNK": {
                    "type": "text"
                }
            }
        }
    }
    
    try:
        # Check if index already exists
        if client.indices.exists(index=index_name):
            print(f"Index '{index_name}' already exists")
            return True
        
        # Create the index
        response = client.indices.create(
            index=index_name,
            body=index_body
        )
        
        print(f"Successfully created index '{index_name}'")
        print(f"Response: {json.dumps(response, indent=2)}")
        return True
        
    except Exception as e:
        print(f"Error creating index: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 create-opensearch-index.py <collection-endpoint> <region>")
        print("Example: python3 create-opensearch-index.py https://abc123.us-east-1.aoss.amazonaws.com us-east-1")
        sys.exit(1)
    
    collection_endpoint = sys.argv[1]
    region = sys.argv[2]
    
    print(f"Creating index in OpenSearch collection: {collection_endpoint}")
    print(f"Region: {region}")
    
    success = create_index(collection_endpoint, region)
    sys.exit(0 if success else 1)
