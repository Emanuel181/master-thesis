# Deploy Implementer Lambda Function (Python)
# This script installs dependencies and deploys the Lambda function to AWS

Write-Host "=== Deploying Implementer Lambda Function ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

$FunctionName = "dev-agent-implementer"
$FolderPath = "./agent-implementer"

Write-Host "Deploying $FunctionName..." -ForegroundColor Yellow

# Navigate to function folder
Push-Location $FolderPath

try {
    # Create package directory
    Write-Host "  Creating package directory..." -ForegroundColor Gray
    if (Test-Path "package") {
        Remove-Item "package" -Recurse -Force
    }
    New-Item -ItemType Directory -Path "package" | Out-Null
    
    # Install dependencies
    Write-Host "  Installing Python dependencies..." -ForegroundColor Gray
    pip install -r requirements.txt -t package/ --quiet
    
    # Copy function code
    Write-Host "  Copying function code..." -ForegroundColor Gray
    Copy-Item "index.py" -Destination "package/"
    
    # Create deployment package
    Write-Host "  Creating deployment package..." -ForegroundColor Gray
    Push-Location "package"
    
    if (Test-Path "../function.zip") {
        Remove-Item "../function.zip" -Force
    }
    
    # Zip the function
    Compress-Archive -Path "*" -DestinationPath "../function.zip" -Force
    
    Pop-Location
    
    # Deploy to AWS
    Write-Host "  Uploading to AWS..." -ForegroundColor Gray
    $result = aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file fileb://function.zip `
        --region us-east-1 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $FunctionName deployed successfully!" -ForegroundColor Green
        
        # Update environment variables
        Write-Host "  Updating environment variables..." -ForegroundColor Gray
        $envVars = @{
            Variables = @{
                AWS_REGION = "us-east-1"
                BEDROCK_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"
                AGENT_ARTIFACTS_BUCKET = "dev-agent-artifacts-bucket"
                EVENT_BUS_NAME = "dev-orchestrator-event-bus"
                DATABASE_URL = (Get-Content ../../.env | Select-String "DATABASE_URL").ToString().Split("=", 2)[1]
            }
        } | ConvertTo-Json -Compress
        
        aws lambda update-function-configuration `
            --function-name $FunctionName `
            --environment $envVars `
            --region us-east-1 | Out-Null
        
        Write-Host "  ✓ Environment variables updated!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to deploy $FunctionName" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
    
    # Cleanup
    Write-Host "  Cleaning up..." -ForegroundColor Gray
    Remove-Item "package" -Recurse -Force
    
} catch {
    Write-Host "  ✗ Error deploying $FunctionName : $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Enable Implementer agent in workflow configuration" -ForegroundColor White
Write-Host "2. Run a security analysis to test fix generation" -ForegroundColor White
Write-Host "3. Check the 'Fixes' tab in Results page" -ForegroundColor White
Write-Host "4. Review and accept/reject fixes" -ForegroundColor White
Write-Host "5. Create pull request with accepted fixes" -ForegroundColor White
