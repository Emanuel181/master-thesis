import zipfile
import os
import subprocess
import shutil

print('Creating function.zip for agent-reporter...')

# Remove old zip if exists
if os.path.exists('function.zip'):
    os.remove('function.zip')

# Create a temp directory for dependencies
temp_dir = 'temp_deps'
if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
os.makedirs(temp_dir)

# Install reportlab to temp directory
print('Installing reportlab dependency...')
subprocess.run([
    'pip', 'install', 'reportlab', '-t', temp_dir, '--quiet'
], check=True)

# Create zip file
zipf = zipfile.ZipFile('function.zip', 'w', zipfile.ZIP_DEFLATED)

# Add the main handler
zipf.write('index.py', 'index.py')

# Add dependencies from temp directory
for root, dirs, files in os.walk(temp_dir):
    for file in files:
        file_path = os.path.join(root, file)
        arcname = os.path.relpath(file_path, temp_dir)
        zipf.write(file_path, arcname)

zipf.close()

# Clean up temp directory
shutil.rmtree(temp_dir)

size_mb = os.path.getsize('function.zip') / (1024 * 1024)
print(f'Created function.zip ({size_mb:.2f} MB)')

