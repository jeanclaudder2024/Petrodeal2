"""
Test script for Python Document Processing API
Tests authentication and template upload endpoints
"""
import requests
import json
import os
from pathlib import Path

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')
TEST_USERNAME = os.getenv('TEST_USERNAME', 'admin')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'admin123')

def test_health_check():
    """Test API health endpoint"""
    print("=" * 60)
    print("Testing Health Check")
    print("=" * 60)
    try:
        response = requests.get(f"{API_BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_auth_me_not_authenticated():
    """Test /auth/me without authentication"""
    print("\n" + "=" * 60)
    print("Testing /auth/me (Not Authenticated)")
    print("=" * 60)
    try:
        response = requests.get(f"{API_BASE_URL}/auth/me")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 401:
            print("[OK] Correctly returns 401 when not authenticated")
            return True
        else:
            print(f"[ERROR] Unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_auth_login():
    """Test login endpoint"""
    print("\n" + "=" * 60)
    print("Testing /auth/login")
    print("=" * 60)
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        print(f"Cookies: {dict(response.cookies)}")
        
        if response.status_code == 200:
            print("[OK] Login successful")
            return response.cookies.get('session')
        else:
            print("[ERROR] Login failed")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_auth_me_authenticated(session_cookie):
    """Test /auth/me with authentication"""
    print("\n" + "=" * 60)
    print("Testing /auth/me (Authenticated)")
    print("=" * 60)
    try:
        cookies = {'session': session_cookie}
        response = requests.get(f"{API_BASE_URL}/auth/me", cookies=cookies)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("[OK] Authentication check successful")
            return True
        else:
            print("[ERROR] Authentication check failed")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_get_templates(session_cookie):
    """Test GET /templates endpoint"""
    print("\n" + "=" * 60)
    print("Testing GET /templates")
    print("=" * 60)
    try:
        cookies = {'session': session_cookie}
        response = requests.get(f"{API_BASE_URL}/templates", cookies=cookies)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Templates found: {len(data.get('templates', []))}")
        if data.get('templates'):
            print(f"First template: {data['templates'][0].get('name', 'N/A')}")
        
        if response.status_code == 200:
            print("[OK] Templates endpoint working")
            return True
        else:
            print("[ERROR] Templates endpoint failed")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_upload_template(session_cookie):
    """Test template upload (without actual file)"""
    print("\n" + "=" * 60)
    print("Testing POST /upload-template (Validation)")
    print("=" * 60)
    try:
        cookies = {'session': session_cookie}
        # Test without file - should fail validation
        response = requests.post(
            f"{API_BASE_URL}/upload-template",
            cookies=cookies,
            data={"name": "test"}
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 422:  # Validation error
            print("[OK] Correctly validates file requirement")
            return True
        else:
            print(f"Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("Python API Test Suite")
    print("=" * 60)
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Test Username: {TEST_USERNAME}")
    print("=" * 60)
    
    results = []
    
    # Test 1: Health check
    results.append(("Health Check", test_health_check()))
    
    # Test 2: Auth me without auth
    results.append(("Auth Me (Not Authenticated)", test_auth_me_not_authenticated()))
    
    # Test 3: Login
    session_cookie = test_auth_login()
    results.append(("Login", session_cookie is not None))
    
    if session_cookie:
        # Test 4: Auth me with auth
        results.append(("Auth Me (Authenticated)", test_auth_me_authenticated(session_cookie)))
        
        # Test 5: Get templates
        results.append(("Get Templates", test_get_templates(session_cookie)))
        
        # Test 6: Upload validation
        results.append(("Upload Template Validation", test_upload_template(session_cookie)))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {test_name}")
    
    print("=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
