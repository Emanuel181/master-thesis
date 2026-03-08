# Deploy Agent Lambda Functions
# This script installs dependencies and deploys the Lambda functions to AWS

Write-Host "=== Deploying Agent Lambda Functions ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Function to deploy a Lambda
function Deploy-Lambda {
    param(
        [string]$FunctionName,
        [string]$FolderPath
    )
    
    Write-Host "Deploying $FunctionName..." -ForegroundColor Yellow
    
    # Navigate to function folder
    Push-Location $FolderPath
    
    try {
        # Install dependencies
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install --production 2>&1 | Out-Null
        
        # Copy Prisma client
        Write-Host "  Copying Prisma client..." -ForegroundColor Gray
        if (Test-Path "../../node_modules/.prisma") {
            Copy-Item -Path "../../node_modules/.prisma" -Destination "./node_modules/" -Recurse -Force
        }
        if (Test-Path "../../node_modules/@prisma") {
            Copy-Item -Path "../../node_modules/@prisma" -Destination "./node_modules/" -Recurse -Force
        }
        
        # Create deployment package
        Write-Host "  Creating deployment package..." -ForegroundColor Gray
        if (Test-Path "function.zip") {
            Remove-Item "function.zip" -Force
        }
        
        # Zip the function
        Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath "function.zip" -Force
        
        # Deploy to AWS
        Write-Host "  Uploading to AWS..." -ForegroundColor Gray
        $result = aws lambda update-function-code `
            --function-name $FunctionName `
            --zip-file fileb://function.zip `
            --region us-east-1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $FunctionName deployed successfully!" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed to deploy $FunctionName" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
        
    } catch {
        Write-Host "  ✗ Error deploying $FunctionName : $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

# Deploy agent-reviewer
Deploy-Lambda -FunctionName "dev-agent-reviewer" -FolderPath "./agent-reviewer"

# Deploy agent-reporter
Deploy-Lambda -FunctionName "dev-agent-reporter" -FolderPath "./agent-reporter"

Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the workflow by running a security analysis" -ForegroundColor White
Write-Host "2. Check CloudWatch logs for any errors" -ForegroundColor White
Write-Host "3. View results in the Results page" -ForegroundColor White
