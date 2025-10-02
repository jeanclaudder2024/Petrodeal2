#!/usr/bin/env python3
"""Test script to verify all imports work correctly"""

try:
    print("Testing imports...")
    
    from fastapi import FastAPI, HTTPException, UploadFile, File, Form
    print("✓ FastAPI imports successful")
    
    from fastapi.middleware.cors import CORSMiddleware
    print("✓ CORS middleware import successful")
    
    from fastapi.responses import JSONResponse, FileResponse
    print("✓ Response imports successful")
    
    import uvicorn
    print("✓ Uvicorn import successful")
    
    import uuid
    print("✓ UUID import successful")
    
    import os
    print("✓ OS import successful")
    
    import tempfile
    print("✓ Tempfile import successful")
    
    import json
    print("✓ JSON import successful")
    
    from pathlib import Path
    print("✓ Pathlib import successful")
    
    from docx import Document
    print("✓ Python-docx import successful")
    
    import re
    print("✓ Regex import successful")
    
    import shutil
    print("✓ Shutil import successful")
    
    import random
    print("✓ Random import successful")
    
    from datetime import datetime, timedelta
    print("✓ Datetime import successful")
    
    from dotenv import load_dotenv
    print("✓ Python-dotenv import successful")
    
    from supabase import create_client, Client
    print("✓ Supabase import successful")
    
    import subprocess
    print("✓ Subprocess import successful")
    
    print("\n🎉 All imports successful! Creating FastAPI app...")
    
    app = FastAPI(title="Test Document Service", version="1.0.0")
    
    @app.get("/")
    async def root():
        return {"message": "Test service is working", "status": "ok"}
    
    print("✓ FastAPI app created successfully")
    print("✓ All tests passed!")
    
except Exception as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()
