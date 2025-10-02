#!/usr/bin/env python3
"""
Simple FastAPI app for testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(title="Simple Document Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Simple Document Service is running", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "simple-document-processing"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint working", "timestamp": "2025-01-01"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print("Starting Simple Document Service...")
    uvicorn.run(app, host="0.0.0.0", port=port)
