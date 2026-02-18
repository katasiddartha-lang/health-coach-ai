#!/usr/bin/env python3
"""
Focused test for the specific issues mentioned in the review request
"""
import requests
import json
from datetime import date

BASE_URL = "https://health-coach-ai-22.preview.emergentagent.com/api"

def test_daily_log_bson():
    """Test daily log with string dates (BSON fix)"""
    print("Testing Daily Log BSON fix...")
    
    # Create a test user first
    user_data = {
        "name": "Test User",
        "email": "test@example.com", 
        "age": 30,
        "gender": "male",
        "height": 175.0,
        "weight": 70.0
    }
    
    user_resp = requests.post(f"{BASE_URL}/users", json=user_data)
    if user_resp.status_code != 200:
        print(f"❌ Failed to create user: {user_resp.text}")
        return False
        
    user_id = user_resp.json()["user_id"]
    print(f"✅ Created test user: {user_id}")
    
    # Test daily log with string date
    log_data = {
        "user_id": user_id,
        "log_date": "2024-01-15",  # String date format
        "breakfast": {"food": "Oatmeal", "portion": "1 cup", "time": "08:00"},
        "lunch": {"food": "Salad", "portion": "Large", "time": "12:30"},
        "dinner": {"food": "Chicken", "portion": "6oz", "time": "19:00"},
        "snacks": {"food": "Apple", "portion": "1 medium"},
        "water_intake": "8 glasses"
    }
    
    log_resp = requests.post(f"{BASE_URL}/daily-logs", json=log_data)
    print(f"Daily log response status: {log_resp.status_code}")
    
    if log_resp.status_code == 200:
        log_result = log_resp.json()
        print(f"✅ Daily log created successfully: {log_result['log_id']}")
        print(f"   Date stored as: {log_result['log_date']} (type: string)")
        return True
    else:
        print(f"❌ Daily log failed: {log_resp.text}")
        return False

def test_workout_plan_bson():
    """Test workout plan generation with string dates (BSON fix)"""
    print("\nTesting Workout Plan BSON fix...")
    
    # Create a test user first
    user_data = {
        "name": "Workout User",
        "email": "workout@example.com", 
        "age": 28,
        "gender": "female",
        "height": 160.0,
        "weight": 60.0
    }
    
    user_resp = requests.post(f"{BASE_URL}/users", json=user_data)
    if user_resp.status_code != 200:
        print(f"❌ Failed to create user: {user_resp.text}")
        return False
        
    user_id = user_resp.json()["user_id"]
    print(f"✅ Created test user: {user_id}")
    
    # Test workout plan generation (should use fallback without valid API key)
    plan_data = {
        "user_id": user_id,
        "hf_api_key": "test_key"
    }
    
    plan_resp = requests.post(f"{BASE_URL}/workout-plans/generate", data=plan_data)
    print(f"Workout plan response status: {plan_resp.status_code}")
    
    if plan_resp.status_code == 200:
        plan_result = plan_resp.json()
        print(f"✅ Workout plan created successfully: {plan_result['plan_id']}")
        return True
    else:
        print(f"❌ Workout plan failed: {plan_resp.text}")
        return False

def test_ai_endpoints_error_handling():
    """Test AI endpoints properly handle invalid API keys"""
    print("\nTesting AI Error Handling...")
    
    # Create a test user and report
    user_data = {
        "name": "AI Test User",
        "email": "ai@example.com", 
        "age": 25,
        "gender": "female",
        "height": 165.0,
        "weight": 55.0
    }
    
    user_resp = requests.post(f"{BASE_URL}/users", json=user_data)
    user_id = user_resp.json()["user_id"]
    
    # Upload a simple test file for analysis
    import io
    test_content = b"Test health report content"
    files = {'file': ('test.pdf', io.BytesIO(test_content), 'application/pdf')}
    upload_data = {'user_id': user_id}
    
    upload_resp = requests.post(f"{BASE_URL}/health-reports/upload", data=upload_data, files=files)
    
    if upload_resp.status_code == 200:
        report_id = upload_resp.json()["report_id"]
        
        # Test AI analysis with invalid key
        analysis_data = {
            "report_id": report_id,
            "hf_api_key": "invalid_key"
        }
        
        analysis_resp = requests.post(f"{BASE_URL}/health-reports/analyze", json=analysis_data)
        
        if analysis_resp.status_code == 500:
            print("✅ AI Analysis properly rejects invalid API key (expected 500 error)")
            return True
        else:
            print(f"❌ AI Analysis unexpected response: {analysis_resp.status_code}")
            return False
    else:
        print("❌ Could not upload report for AI testing")
        return False

if __name__ == "__main__":
    print("🧪 Running focused tests for BSON fixes and AI error handling")
    
    results = []
    results.append(test_daily_log_bson())
    results.append(test_workout_plan_bson())  
    results.append(test_ai_endpoints_error_handling())
    
    passed = sum(results)
    total = len(results)
    
    print(f"\n📊 FOCUSED TEST RESULTS:")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All focused tests passed - BSON fixes are working!")
    else:
        print("⚠️ Some tests failed - check the output above")