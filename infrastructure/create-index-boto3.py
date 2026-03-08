#!/usr/bin/env python3
"""
Create OpenSearch index using only boto3 (no opensearch-py needed)
"""
import boto3
import json
import sys
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
try:
    from urllib3 import PoolManager
    http = PoolManager()
except ImportError:
    import urllib.request
    http = None

def create_index_with_boto3(endpoint, region):
    """Create index using boto3 and SigV4 signing"""
    
    # Remove https:// if present
    endpoint = endpoint.replace('https://', 'https://')
    
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
    
    # Get AWS credentials
    session = boto3.Session()
    credentials = session.get_credentials()
    
    # Create signed request
    url = f"{endpoint}/document-embeddings"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(index_config).encode('utf-8')
    
    request = AWSRequest(method="PUT", url=url, data=body, headers=headers)
    SigV4Auth(credentials, "aoss", region).add_auth(request)
    
    print(f"Creating index at: {url}")
    
    try:
        if http:
            # Use urllib3
            response = http.request(
                request.method,
                request.url,
                body=request.body,
                headers=dict(request.headers)
            )
            status = response.status
            data = response.data.decode('utf-8')
        else:
            # Use urllib
            req = urllib.request.Request(
                request.url,
                data=request.body,
                headers=dict(request.headers),
                method=request.method
            )
            with urllib.request.urlopen(req) as response:
                status = response.status
                data = response.read().decode('utf-8')
        
        print(f"Status: {status}")
        print(f"Response: {data}")
        
        if status in [200, 201]:
            print("\n✓ Index created successfully")
            return True
        elif status == 400 and "resource_already_exists" in data:
            print("\n✓ Index already exists")
            return True
        else:
            print(f"\n✗ Failed to create index: {data}")
            return False
            
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 create-index-boto3.py <endpoint> <region>")
        sys.exit(1)
    
    endpoint = sys.argv[1]
    region = sys.argv[2]
    
    success = create_index_with_boto3(endpoint, region)
    sys.exit(0 if success else 1)
