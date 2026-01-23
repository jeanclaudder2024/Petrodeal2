"""
Script to identify and clean up missing template files
This will check which templates in the database/filesystem don't have actual files
"""
import os
import json
from pathlib import Path

# Configuration
TEMPLATES_DIR = Path(__file__).parent / 'document-processor' / 'templates'
STORAGE_DIR = Path(__file__).parent / 'document-processor' / 'storage'
METADATA_PATH = STORAGE_DIR / 'template_metadata.json'
DELETED_TEMPLATES_PATH = STORAGE_DIR / 'deleted_templates.json'

def check_templates():
    """Check which templates are missing files"""
    print("=" * 60)
    print("Template File Checker")
    print("=" * 60)
    print(f"Templates directory: {TEMPLATES_DIR}")
    print()
    
    if not TEMPLATES_DIR.exists():
        print(f"ERROR: Templates directory does not exist: {TEMPLATES_DIR}")
        return
    
    # Get all .docx files in templates directory
    existing_files = set()
    for file in TEMPLATES_DIR.glob('*.docx'):
        existing_files.add(file.name.lower())
        existing_files.add(file.name)  # Also keep original case
    
    print(f"Found {len(existing_files)} template files in directory")
    print()
    
    # Check metadata file
    missing_from_files = []
    if METADATA_PATH.exists():
        try:
            with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            print(f"Checking {len(metadata)} templates in metadata...")
            for template_name, template_data in metadata.items():
                # Check various filename variations
                file_variations = [
                    template_name,
                    template_name.lower(),
                    template_name.upper(),
                    template_name + '.docx' if not template_name.endswith('.docx') else template_name,
                ]
                
                found = False
                for var in file_variations:
                    if var in existing_files:
                        found = True
                        break
                    # Also check case-insensitive
                    for existing in existing_files:
                        if existing.lower() == var.lower():
                            found = True
                            break
                    if found:
                        break
                
                if not found:
                    missing_from_files.append(template_name)
                    print(f"  ✗ Missing: {template_name}")
        except Exception as e:
            print(f"Error reading metadata: {e}")
    
    # List all files in directory
    print()
    print("=" * 60)
    print("Files in templates directory:")
    print("=" * 60)
    for file in sorted(TEMPLATES_DIR.glob('*.docx')):
        size = file.stat().st_size
        print(f"  ✓ {file.name} ({size:,} bytes)")
    
    # Show missing files
    if missing_from_files:
        print()
        print("=" * 60)
        print(f"Found {len(missing_from_files)} templates in metadata without files:")
        print("=" * 60)
        for name in missing_from_files:
            print(f"  - {name}")
        print()
        print("These can be removed from metadata or marked as deleted.")
    else:
        print()
        print("✓ All templates in metadata have corresponding files!")
    
    # Check deleted templates
    if DELETED_TEMPLATES_PATH.exists():
        try:
            with open(DELETED_TEMPLATES_PATH, 'r', encoding='utf-8') as f:
                deleted_data = json.load(f)
            deleted_list = deleted_data.get('deleted_templates', [])
            if deleted_list:
                print()
                print("=" * 60)
                print(f"Deleted templates (marked for exclusion): {len(deleted_list)}")
                print("=" * 60)
                for name in deleted_list[:10]:  # Show first 10
                    print(f"  - {name}")
                if len(deleted_list) > 10:
                    print(f"  ... and {len(deleted_list) - 10} more")
        except Exception as e:
            print(f"Error reading deleted templates: {e}")

if __name__ == "__main__":
    check_templates()
