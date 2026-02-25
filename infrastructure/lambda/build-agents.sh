#!/bin/bash
# Deploy Lambda Agents with Linux-compatible dependencies
# Run this script from the infrastructure/lambda directory

set -e

echo "=========================================="
echo "Deploying Lambda Agents for AWS"
echo "=========================================="

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Docker found, using Docker for Linux builds..."
    USE_DOCKER=true
else
    echo "Docker not found, will try pip with platform flags..."
    USE_DOCKER=false
fi

# Agents to deploy
AGENTS=("agent-implementer" "agent-reviewer" "agent-tester" "agent-reporter")

for AGENT in "${AGENTS[@]}"; do
    echo ""
    echo "----------------------------------------"
    echo "Building $AGENT..."
    echo "----------------------------------------"

    cd "$AGENT"

    # Clean up old build artifacts
    rm -rf package/
    rm -f function.zip

    if [ "$USE_DOCKER" = true ]; then
        # Use Docker to build Linux-compatible packages
        docker run --rm -v "$(pwd)":/var/task \
            public.ecr.aws/sam/build-python3.11:latest \
            /bin/bash -c "
                pip install -r requirements.txt -t /var/task/package/ --platform manylinux2014_x86_64 --only-binary=:all:
                cd /var/task/package && zip -r9 ../function.zip .
                cd /var/task && zip -g function.zip index.py
            "
    else
        # Use pip with platform flags (requires pip >= 20.3)
        pip install -r requirements.txt -t package/ \
            --platform manylinux2014_x86_64 \
            --implementation cp \
            --python-version 3.11 \
            --only-binary=:all: \
            --upgrade

        # Create the deployment package
        cd package
        zip -r9 ../function.zip .
        cd ..
        zip -g function.zip index.py
    fi

    echo "✓ Built $AGENT/function.zip"

    cd ..
done

echo ""
echo "=========================================="
echo "All agents built successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload function.zip files to S3 or use Terraform to deploy"
echo "2. Or use AWS CLI: aws lambda update-function-code --function-name <name> --zip-file fileb://function.zip"

