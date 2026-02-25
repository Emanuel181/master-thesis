import zipfile
import os

print('Creating function.zip...')

# Remove old zip if exists
if os.path.exists('function.zip'):
    os.remove('function.zip')

zipf = zipfile.ZipFile('function.zip', 'w', zipfile.ZIP_DEFLATED)

# Add all package contents
file_count = 0
for root, dirs, files in os.walk('package'):
    # Skip __pycache__ directories
    dirs[:] = [d for d in dirs if d != '__pycache__']
    for file in files:
        if file.endswith('.pyc'):
            continue
        file_path = os.path.join(root, file)
        arcname = os.path.relpath(file_path, 'package')
        zipf.write(file_path, arcname)
        file_count += 1

# Add the main handler
zipf.write('index.py', 'index.py')
file_count += 1

zipf.close()

size_mb = os.path.getsize('function.zip') / 1024 / 1024
print(f'Created function.zip with {file_count} files ({size_mb:.2f} MB)')

