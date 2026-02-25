# Deploy all Lambda functions
# Run from: C:\Users\emanu\Desktop\master\infrastructure\lambda

Write-Host "Deploying Lambda functions..." -ForegroundColor Cyan

# Deploy agent-reviewer
Write-Host "`n=== Deploying agent-reviewer ===" -ForegroundColor Yellow
Push-Location "agent-reviewer"
python create_zip.py
if ($LASTEXITCODE -eq 0) {
    aws lambda update-function-code --function-name dev-agent-reviewer --zip-file "fileb://function.zip" --region us-east-1 --no-cli-pager | Select-String -Pattern "FunctionName|LastModified"
    Write-Host "agent-reviewer deployed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to create agent-reviewer zip" -ForegroundColor Red
}
Pop-Location

# Deploy agent-implementer
Write-Host "`n=== Deploying agent-implementer ===" -ForegroundColor Yellow
Push-Location "agent-implementer"
python create_zip.py
if ($LASTEXITCODE -eq 0) {
    aws lambda update-function-code --function-name dev-agent-implementer --zip-file "fileb://function.zip" --region us-east-1 --no-cli-pager | Select-String -Pattern "FunctionName|LastModified"
    Write-Host "agent-implementer deployed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to create agent-implementer zip" -ForegroundColor Red
}
Pop-Location

# Deploy agent-reporter
Write-Host "`n=== Deploying agent-reporter ===" -ForegroundColor Yellow
Push-Location "agent-reporter"
python create_zip.py
if ($LASTEXITCODE -eq 0) {
    aws lambda update-function-code --function-name dev-agent-reporter --zip-file "fileb://function.zip" --region us-east-1 --no-cli-pager | Select-String -Pattern "FunctionName|LastModified"
    Write-Host "agent-reporter deployed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to create agent-reporter zip" -ForegroundColor Red
}
Pop-Location

# Deploy agent-tester
Write-Host "`n=== Deploying agent-tester ===" -ForegroundColor Yellow
Push-Location "agent-tester"
if (Test-Path "create_zip.py") {
    python create_zip.py
} else {
    # Create simple zip if no create_zip.py exists
    Compress-Archive -Path "index.py" -DestinationPath "function.zip" -Force
}
aws lambda update-function-code --function-name dev-agent-tester --zip-file "fileb://function.zip" --region us-east-1 --no-cli-pager | Select-String -Pattern "FunctionName|LastModified"
Write-Host "agent-tester deployed successfully" -ForegroundColor Green
Pop-Location

Write-Host "`n=== Deployment complete ===" -ForegroundColor Cyan

