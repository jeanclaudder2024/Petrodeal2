"""
Quick script to mark a problematic template as deleted
"""
import json
import os
from pathlib import Path

STORAGE_DIR = Path(__file__).parent / 'document-processor' / 'storage'
DELETED_TEMPLATES_PATH = STORAGE_DIR / 'deleted_templates.json'

# The problematic template from the error
PROBLEMATIC_TEMPLATE = "SGS   ANALYSIS NEWW.docx"

def mark_as_deleted(template_name: str):
    """Mark a template as deleted"""
    # Ensure storage directory exists
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load existing deleted templates
    if DELETED_TEMPLATES_PATH.exists():
        with open(DELETED_TEMPLATES_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = {"deleted_templates": [], "last_updated": ""}
    
    deleted_list = data.get('deleted_templates', [])
    
    # Add variations of the template name
    variations = [
        template_name,
        template_name.lower(),
        template_name.upper(),
        template_name.replace('  ', ' '),  # Double space to single
        template_name.replace('   ', ' '),  # Triple space to single
        template_name.replace('.docx', '') + '.docx',
    ]
    
    added = False
    for var in variations:
        if var and var not in deleted_list:
            deleted_list.append(var)
            added = True
            print(f"Added to deleted list: {var}")
    
    if added:
        data['deleted_templates'] = deleted_list
        data['last_updated'] = __import__('datetime').datetime.now().isoformat()
        
        with open(DELETED_TEMPLATES_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n[OK] Template '{template_name}' marked as deleted")
        print(f"Total deleted templates: {len(deleted_list)}")
    else:
        print(f"Template '{template_name}' already marked as deleted")

if __name__ == "__main__":
    print("=" * 60)
    print("Mark Template as Deleted")
    print("=" * 60)
    mark_as_deleted(PROBLEMATIC_TEMPLATE)
    print("\nDone! Restart Python API for changes to take effect.")
