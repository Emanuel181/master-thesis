# Deploy agent-implementer to AWS Lambda
Set-Location "C:\Users\emanu\Desktop\master\infrastructure\lambda\agent-implementer"

Write-Host "Creating zip file..."
python create_zip.py

Write-Host "Deploying to AWS Lambda..."
aws lambda update-function-code `
    --function-name dev-agent-implementer `
    --zip-file fileb://function.zip `
    --region us-east-1 `
    --query "[FunctionName, LastModified]" `
    --output text

Write-Host "Done!"


