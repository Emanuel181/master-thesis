"""
Initialize Run Lambda Function
Loads configuration from Aurora and prepares run context
"""

import json
import os
import boto3
from datetime import datetime
import psycopg2

# AWS clients
secrets_client = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')

# Environment variables
RUNS_TABLE = os.environ['RUNS_TABLE']
AURORA_SECRET_ARN = os.environ['AURORA_SECRET_ARN']
DOCUMENTS_BUCKET = os.environ['DOCUMENTS_BUCKET']

def get_db_connection():
    """Get database connection using credentials from Secrets Manager"""
    secret = secrets_client.get_secret_value(SecretId=AURORA_SECRET_ARN)
    creds = json.loads(secret['SecretString'])
    
    return psycopg2.connect(
        host=creds['host'],
        port=creds.get('port', 5432),
        database=creds['dbname'],
        user=creds['username'],
        password=creds['password']
    )

def load_use_cases(conn, group_ids):
    """Load use cases from Aurora for the specified groups"""
    cursor = conn.cursor()
    
    # Query use cases with their documents
    query = """
        SELECT 
            uc.id,
            uc.title,
            uc.content,
            uc."groupId",
            json_agg(
                json_build_object(
                    'id', p.id,
                    'title', p.title,
                    's3Key', p."s3Key",
                    'url', p.url
                )
            ) FILTER (WHERE p.id IS NOT NULL) as documents
        FROM "KnowledgeBaseCategory" uc
        LEFT JOIN "Pdf" p ON p."useCaseId" = uc.id
        WHERE uc."groupId" = ANY(%s)
        GROUP BY uc.id, uc.title, uc.content, uc."groupId"
        ORDER BY uc."order"
    """
    
    cursor.execute(query, (group_ids,))
    rows = cursor.fetchall()
    
    use_cases = []
    for row in rows:
        use_cases.append({
            'id': row[0],
            'title': row[1],
            'content': row[2],
            'groupId': row[3],
            'documents': row[4] or [],
            'enableImplementer': True,  # Default settings
            'enableTester': True,
            'enableReporter': True
        })
    
    cursor.close()
    return use_cases

def load_prompts(conn, user_id):
    """Load user's prompts from Aurora"""
    cursor = conn.cursor()
    
    query = """
        SELECT id, agent, title, text, "s3Key"
        FROM "Prompt"
        WHERE "userId" = %s
        ORDER BY "order"
    """
    
    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()
    
    prompts = {}
    for row in rows:
        agent_type = row[1]
        prompts[agent_type] = {
            'id': row[0],
            'title': row[2],
            'text': row[3],
            's3Key': row[4]
        }
    
    cursor.close()
    return prompts

def create_run_record(run_id, user_id, use_case_count):
    """Create run record in DynamoDB"""
    table = dynamodb.Table(RUNS_TABLE)
    
    table.put_item(Item={
        'runId': run_id,
        'userId': user_id,
        'status': 'initializing',
        'useCaseCount': use_case_count,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    })

def handler(event, context):
    """
    Lambda handler for initializing a run
    
    Input:
        {
            "runId": "run_123",
            "userId": "user_abc",
            "groupIds": ["group_1", "group_2"]
        }
    
    Output:
        {
            "useCases": [...],
            "prompts": {...},
            "useCaseCount": 3
        }
    """
    try:
        run_id = event['runId']
        user_id = event['userId']
        group_ids = event['groupIds']
        
        print(f"Initializing run {run_id} for user {user_id}")
        
        # Connect to Aurora
        conn = get_db_connection()
        
        # Load configuration
        use_cases = load_use_cases(conn, group_ids)
        prompts = load_prompts(conn, user_id)
        
        conn.close()
        
        print(f"Loaded {len(use_cases)} use cases")
        
        # Create run record
        create_run_record(run_id, user_id, len(use_cases))
        
        return {
            'useCases': use_cases,
            'prompts': prompts,
            'useCaseCount': len(use_cases),
            'documentsBucket': DOCUMENTS_BUCKET
        }
        
    except Exception as e:
        print(f"Error initializing run: {str(e)}")
        raise
