import json
import jsonschema
import glob
import os
import sys

def validate_content():
    # Load schema
    try:
        with open('schema.json', 'r') as f:
            schema = json.load(f)
    except FileNotFoundError:
        print("Error: schema.json not found.")
        return

    # Find all content files
    content_files = glob.glob('content_*.json')
    content_files.sort()

    print(f"Found {len(content_files)} content files to validate.\n")

    failure_count = 0
    
    for file_path in content_files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            jsonschema.validate(instance=data, schema=schema)
            print(f"✅ {file_path}: Valid")
            
        except json.JSONDecodeError as e:
            print(f"❌ {file_path}: Invalid JSON format")
            print(f"   {e}")
            failure_count += 1
        except jsonschema.exceptions.ValidationError as e:
            print(f"❌ {file_path}: Schema Validation Failed")
            print(f"   Message: {e.message}")
            print(f"   Path: {' -> '.join(str(p) for p in e.path)}")
            failure_count += 1
        except Exception as e:
            print(f"❌ {file_path}: Unexpected error: {e}")
            failure_count += 1

    print("\n" + "="*30)
    if failure_count == 0:
        print("🎉 All files passed validation!")
    else:
        print(f"⚠️  {failure_count} files failed validation.")
        sys.exit(1)

if __name__ == "__main__":
    validate_content()
