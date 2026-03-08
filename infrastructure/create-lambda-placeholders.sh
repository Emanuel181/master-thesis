#!/bin/bash
# Script to create placeholder Lambda functions

set -e

LAMBDA_DIR="lambda"
mkdir -p "$LAMBDA_DIR"

# List of Lambda functions needed
FUNCTIONS=(
    "initialize-run"
    "agent-reviewer"
    "agent-implementer"
    "agent-tester"
    "agent-reporter"
    "websocket-connect"
    "websocket-disconnect"
    "websocket-message"
    "event-streamer"
)

# Create a simple placeholder handler
create_placeholder() {
    local func_name=$1
    local temp_dir=$(mktemp -d)
    
    cat > "$temp_dir/index.py" << 'EOF'
"""
Placeholder Lambda function
Replace with actual implementation
"""

def handler(event, context):
    """Placeholder handler"""
    print(f"Placeholder function called with event: {event}")
    return {
        'statusCode': 200,
        'body': 'Placeholder function - replace with actual implementation'
    }
EOF
    
    # Create ZIP file
    cd "$temp_dir"
    zip -q "$func_name.zip" index.py
    mv "$func_name.zip" "$OLDPWD/$LAMBDA_DIR/"
    cd "$OLDPWD"
    rm -rf "$temp_dir"
    
    echo "Created $func_name.zip"
}

# Create all placeholder functions
for func in "${FUNCTIONS[@]}"; do
    create_placeholder "$func"
done

echo ""
echo "All placeholder Lambda functions created in $LAMBDA_DIR/"
echo "You can now run terraform apply"
