# OpenSearch Serverless for RAG Vector Database
# Stores document embeddings for knowledge base retrieval

resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${var.environment}-rag-encryption"
  type = "encryption"
  policy = jsonencode({
    Rules = [
      {
        Resource = [
          "collection/${var.environment}-rag-vectors"
        ]
        ResourceType = "collection"
      }
    ]
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "network" {
  name = "${var.environment}-rag-network"
  type = "network"
  policy = jsonencode([
    {
      Rules = [
        {
          Resource = [
            "collection/${var.environment}-rag-vectors"
          ]
          ResourceType = "collection"
        }
      ]
      AllowFromPublic = true
    }
  ])
}

resource "aws_opensearchserverless_access_policy" "data_access" {
  name = "${var.environment}-rag-access"
  type = "data"
  policy = jsonencode([
    {
      Rules = [
        {
          Resource = [
            "collection/${var.environment}-rag-vectors"
          ]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DeleteCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
          ResourceType = "collection"
        },
        {
          Resource = [
            "index/${var.environment}-rag-vectors/*"
          ]
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument"
          ]
          ResourceType = "index"
        }
      ]
      Principal = [
        aws_iam_role.agent_lambda.arn,
        aws_iam_role.bedrock_kb.arn,
        data.aws_caller_identity.current.arn
      ]
    }
  ])
}

resource "aws_opensearchserverless_collection" "rag_vectors" {
  name = "${var.environment}-rag-vectors"
  type = "VECTORSEARCH"

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network
  ]

  tags = {
    Name = "${var.environment}-rag-vectors"
  }
}

# Bedrock Knowledge Base - TEMPORARILY DISABLED
# Uncomment when OpenSearch access policy permissions are resolved

# resource "null_resource" "create_opensearch_index" {
#   depends_on = [
#     aws_opensearchserverless_collection.rag_vectors,
#     aws_opensearchserverless_access_policy.data_access
#   ]
# 
#   provisioner "local-exec" {
#     command = <<-EOT
#       sleep 30
#       pip3 install opensearch-py --quiet || pip install opensearch-py --quiet
#       python3 ${path.module}/../create-opensearch-index.py ${aws_opensearchserverless_collection.rag_vectors.collection_endpoint} ${var.aws_region}
#     EOT
#   }
# 
#   triggers = {
#     collection_id = aws_opensearchserverless_collection.rag_vectors.id
#   }
# }

# resource "aws_bedrockagent_knowledge_base" "documents" {
#   name     = "${var.environment}-document-kb"
#   role_arn = aws_iam_role.bedrock_kb.arn
# 
#   knowledge_base_configuration {
#     vector_knowledge_base_configuration {
#       embedding_model_arn = "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v2:0"
#     }
#     type = "VECTOR"
#   }
# 
#   storage_configuration {
#     type = "OPENSEARCH_SERVERLESS"
#     opensearch_serverless_configuration {
#       collection_arn    = aws_opensearchserverless_collection.rag_vectors.arn
#       vector_index_name = "document-embeddings"
#       field_mapping {
#         vector_field   = "embedding"
#         text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
#         metadata_field = "AMAZON_BEDROCK_METADATA"
#       }
#     }
#   }
# 
#   depends_on = [
#     null_resource.create_opensearch_index,
#     aws_iam_role_policy.bedrock_kb_opensearch
#   ]
# 
#   tags = {
#     Name = "${var.environment}-document-kb"
#   }
# }

# resource "aws_bedrockagent_data_source" "documents" {
#   knowledge_base_id = aws_bedrockagent_knowledge_base.documents.id
#   name              = "${var.environment}-documents"
#   
#   data_source_configuration {
#     type = "S3"
#     s3_configuration {
#       bucket_arn = data.aws_s3_bucket.documents.arn
#     }
#   }
# 
#   vector_ingestion_configuration {
#     chunking_configuration {
#       chunking_strategy = "FIXED_SIZE"
#       fixed_size_chunking_configuration {
#         max_tokens         = 512
#         overlap_percentage = 20
#       }
#     }
#   }
# }

# IAM role for Bedrock Knowledge Base
resource "aws_iam_role" "bedrock_kb" {
  name = "${var.environment}-bedrock-kb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_s3" {
  name = "${var.environment}-bedrock-kb-s3"
  role = aws_iam_role.bedrock_kb.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          data.aws_s3_bucket.documents.arn,
          "${data.aws_s3_bucket.documents.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_opensearch" {
  name = "${var.environment}-bedrock-kb-opensearch"
  role = aws_iam_role.bedrock_kb.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = [
          aws_opensearchserverless_collection.rag_vectors.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_bedrock" {
  name = "${var.environment}-bedrock-kb-bedrock"
  role = aws_iam_role.bedrock_kb.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v2:0"
        ]
      }
    ]
  })
}

# Outputs moved to main.tf to avoid duplication
