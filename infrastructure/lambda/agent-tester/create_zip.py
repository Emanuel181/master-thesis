import zipfile
import os

print('Creating function.zip...')

# Remove old zip if exists
if os.path.exists('function.zip'):
    os.remove('function.zip')

zipf = zipfile.ZipFile('function.zip', 'w', zipfile.ZIP_DEFLATED)

# Add the main handler
zipf.write('index.py', 'index.py')

zipf.close()

size_kb = os.path.getsize('function.zip') / 1024
print(f'Created function.zip ({size_kb:.2f} KB)')

