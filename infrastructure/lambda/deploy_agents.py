"""
Deploy Lambda agents to AWS
"""
import subprocess
import os
import zipfile
import sys

def create_zip(agent_dir, agent_name):
    """Create deployment zip for an agent"""
    index_file = os.path.join(agent_dir, 'index.py')
    zip_file = os.path.join(agent_dir, 'function.zip')

    if not os.path.exists(index_file):
        print(f"  [SKIP] {agent_name}: index.py not found")
        return None

    # For implementer, we need to include packages
    if agent_name == 'agent-implementer':
        package_dir = os.path.join(agent_dir, 'package')
        if os.path.exists(package_dir):
            print(f"  Creating zip with packages for {agent_name}...")
            with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as z:
                # Add package contents
                for root, dirs, files in os.walk(package_dir):
                    dirs[:] = [d for d in dirs if d != '__pycache__']
                    for file in files:
                        if file.endswith('.pyc'):
                            continue
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, package_dir)
                        z.write(file_path, arcname)
                # Add index.py
                z.write(index_file, 'index.py')
        else:
            print(f"  Creating simple zip for {agent_name}...")
            with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as z:
                z.write(index_file, 'index.py')
    else:
        print(f"  Creating simple zip for {agent_name}...")
        with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as z:
            z.write(index_file, 'index.py')

    size_kb = os.path.getsize(zip_file) / 1024
    print(f"  Created {agent_name}/function.zip ({size_kb:.1f} KB)")
    return zip_file

def deploy_lambda(zip_file, function_name, region='us-east-1'):
    """Deploy Lambda function using AWS CLI"""
    cmd = [
        'aws', 'lambda', 'update-function-code',
        '--function-name', function_name,
        '--zip-file', f'fileb://{zip_file}',
        '--region', region
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"  [OK] Deployed {function_name}")
        return True
    else:
        print(f"  [ERROR] Failed to deploy {function_name}: {result.stderr}")
        return False

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    agents = [
        ('agent-reviewer', 'dev-agent-reviewer'),
        ('agent-implementer', 'dev-agent-implementer'),
        ('agent-tester', 'dev-agent-tester'),
        ('agent-reporter', 'dev-agent-reporter'),
    ]

    print("=" * 50)
    print("Deploying Lambda Agents")
    print("=" * 50)

    for agent_dir_name, function_name in agents:
        agent_dir = os.path.join(base_dir, agent_dir_name)

        if not os.path.exists(agent_dir):
            print(f"\n[SKIP] {agent_dir_name}: directory not found")
            continue

        print(f"\n[{agent_dir_name}]")

        # Create zip
        zip_file = create_zip(agent_dir, agent_dir_name)
        if not zip_file:
            continue

        # Deploy
        deploy_lambda(zip_file, function_name)

    print("\n" + "=" * 50)
    print("Deployment complete!")
    print("=" * 50)

if __name__ == '__main__':
    main()

