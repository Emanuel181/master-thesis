# Deploy Lambda Agents with Linux-compatible dependencies
# Run this script from the infrastructure/lambda directory
# Requires Docker Desktop or pip >= 20.3

param(
    [switch]$UseDocker = $false,
    [string]$Agent = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploying Lambda Agents for AWS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Docker is available
$DockerAvailable = $false
try {
    docker --version | Out-Null
    $DockerAvailable = $true
    Write-Host "Docker found!" -ForegroundColor Green
} catch {
    Write-Host "Docker not found, will use pip with platform flags..." -ForegroundColor Yellow
}

# Agents to deploy
if ($Agent -eq "all") {
    $Agents = @("agent-implementer", "agent-reviewer", "agent-tester", "agent-reporter")
} else {
    $Agents = @($Agent)
}

foreach ($AgentName in $Agents) {
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "Building $AgentName..." -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow

    $AgentPath = Join-Path $PSScriptRoot $AgentName

    if (-not (Test-Path $AgentPath)) {
        Write-Host "Agent directory not found: $AgentPath" -ForegroundColor Red
        continue
    }

    Push-Location $AgentPath

    try {
        # Clean up old build artifacts
        if (Test-Path "package") { Remove-Item -Recurse -Force "package" }
        if (Test-Path "function.zip") { Remove-Item -Force "function.zip" }

        if ($UseDocker -and $DockerAvailable) {
            Write-Host "Using Docker for Linux-compatible build..." -ForegroundColor Cyan

            # Use Docker to build Linux-compatible packages
            docker run --rm -v "${PWD}:/var/task" `
                public.ecr.aws/sam/build-python3.11:latest `
                /bin/bash -c "pip install -r requirements.txt -t /var/task/package/ --platform manylinux2014_x86_64 --only-binary=:all: && cd /var/task/package && zip -r9 ../function.zip . && cd /var/task && zip -g function.zip index.py"
        } else {
            Write-Host "Using pip with platform flags for Linux build..." -ForegroundColor Cyan

            # Create package directory
            New-Item -ItemType Directory -Force -Path "package" | Out-Null

            # Install dependencies for Linux platform
            pip install -r requirements.txt -t package/ `
                --platform manylinux2014_x86_64 `
                --implementation cp `
                --python-version 3.11 `
                --only-binary=:all: `
                --upgrade

            # Create the deployment package using Python's zipfile
            # (More reliable on Windows than using external zip tools)
            python -c @"
import zipfile
import os

with zipfile.ZipFile('function.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Add all package contents
    for root, dirs, files in os.walk('package'):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, 'package')
            zipf.write(file_path, arcname)

    # Add the main handler
    zipf.write('index.py', 'index.py')

print(f'Created function.zip with {len(zipf.namelist())} files')
"@
        }

        if (Test-Path "function.zip") {
            $size = (Get-Item "function.zip").Length / 1MB
            Write-Host "✓ Built $AgentName/function.zip (${size:N2} MB)" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to create function.zip for $AgentName" -ForegroundColor Red
        }

    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Build complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy using Terraform: cd ../terraform && terraform apply" -ForegroundColor White
Write-Host "2. Or use AWS CLI:" -ForegroundColor White
Write-Host "   aws lambda update-function-code --function-name dev-agent-implementer --zip-file fileb://agent-implementer/function.zip" -ForegroundColor Gray

