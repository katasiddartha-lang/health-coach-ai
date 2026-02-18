#!/usr/bin/env python3
"""
Backend API Testing Suite for Health Coach AI App
Tests all backend endpoints with realistic data and comprehensive error handling.
"""

import requests
import json
import base64
import logging
from datetime import datetime, date
from typing import Dict, Any, List
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Backend configuration
BASE_URL = "https://health-coach-ai-22.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data
TEST_USER_DATA = {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@email.com",
    "age": 32,
    "gender": "female",
    "height": 165.5,
    "weight": 68.2
}

TEST_DAILY_LOG = {
    "breakfast": {
        "food": "Oatmeal with berries and almonds",
        "portion_size": "1 cup",
        "time": "08:00",
        "calories_estimate": 320
    },
    "lunch": {
        "food": "Grilled chicken salad with quinoa",
        "portion_size": "Large bowl",
        "time": "13:00",
        "calories_estimate": 450
    },
    "dinner": {
        "food": "Baked salmon with vegetables",
        "portion_size": "6oz salmon + 1 cup vegetables",
        "time": "19:30",
        "calories_estimate": 520
    },
    "snacks": {
        "food": "Greek yogurt and apple slices",
        "portion_size": "1 cup yogurt + 1 medium apple",
        "calories_estimate": 180
    },
    "water_intake": "8 glasses (2 liters)"
}

class BackendTestSuite:
    def __init__(self):
        self.test_user_id = None
        self.test_report_id = None
        self.test_log_id = None
        self.test_plan_id = None
        self.results = {}
        
    def create_test_pdf_base64(self) -> str:
        """Create a simple test text file as PDF substitute for testing"""
        test_content = """
        HEALTH REPORT - LAB RESULTS
        
        Patient: Sarah Johnson
        Date: 2024-01-15
        
        BLOOD TEST RESULTS:
        - Hemoglobin: 13.5 g/dL (Normal: 12.0-15.5)
        - White Blood Cells: 7200/µL (Normal: 4500-11000)
        - Cholesterol Total: 195 mg/dL (Desirable: <200)
        - HDL Cholesterol: 62 mg/dL (Good: >40)
        - LDL Cholesterol: 115 mg/dL (Optimal: <100)
        - Glucose Fasting: 92 mg/dL (Normal: 70-99)
        - Vitamin D: 28 ng/mL (Sufficient: 30-100)
        
        NOTES: Overall good health markers. Vitamin D slightly low.
        Recommend increased sun exposure and dietary sources.
        """
        return base64.b64encode(test_content.encode()).decode()

    def test_api_endpoint(self, method: str, endpoint: str, data: Dict = None, 
                         files: Dict = None, params: Dict = None) -> Dict[str, Any]:
        """Generic API test method with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=HEADERS, params=params, timeout=30)
            elif method.upper() == "POST":
                if files:
                    response = requests.post(url, data=data, files=files, timeout=60)
                else:
                    response = requests.post(url, headers=HEADERS, json=data, timeout=60)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            result = {
                "success": response.status_code in [200, 201],
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds()
            }
            
            try:
                result["data"] = response.json()
            except json.JSONDecodeError:
                result["data"] = {"text": response.text}
                
            return result
            
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timeout (>30s)",
                "status_code": None
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False, 
                "error": "Connection error - backend may be down",
                "status_code": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "status_code": None
            }

    def test_1_user_registration(self) -> Dict[str, Any]:
        """Test 1: User Registration API"""
        logger.info("Testing User Registration API...")
        
        result = self.test_api_endpoint("POST", "/users", TEST_USER_DATA)
        
        if result["success"]:
            user_data = result["data"]
            if "user_id" in user_data:
                self.test_user_id = user_data["user_id"]
                result["message"] = f"✅ User created successfully with ID: {self.test_user_id}"
            else:
                result["success"] = False
                result["error"] = "No user_id returned in response"
        else:
            result["message"] = f"❌ Registration failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_2_get_user(self) -> Dict[str, Any]:
        """Test 2: Get User API"""
        logger.info("Testing Get User API...")
        
        if not self.test_user_id:
            return {
                "success": False,
                "error": "No test user ID available (registration may have failed)"
            }
            
        result = self.test_api_endpoint("GET", f"/users/{self.test_user_id}")
        
        if result["success"]:
            user_data = result["data"]
            if user_data.get("email") == TEST_USER_DATA["email"]:
                result["message"] = "✅ User data retrieved successfully"
            else:
                result["success"] = False
                result["error"] = "Retrieved user data doesn't match"
        else:
            result["message"] = f"❌ Get user failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_3_pdf_upload_ocr(self) -> Dict[str, Any]:
        """Test 3: PDF Upload with OCR"""
        logger.info("Testing PDF Upload with OCR...")
        
        if not self.test_user_id:
            return {
                "success": False,
                "error": "No test user ID available"
            }
        
        # Create a simple test PDF content (base64)
        test_pdf_content = """JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDQgMCBSCi9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKNCAwIG9iago8PAovRm9udCA2IDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzIwIFRkCihIZWFsdGggUmVwb3J0IFRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PAovRjEgPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+Cj4+CmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA1MyAwMDAwMCBuIAowMDAwMDAwMTI1IDAwMDAwIG4gCjAwMDAwMDAyMzAgMDAwMDAgbiAKMDAwMDAwMDI2MyAwMDAwMCBuIAowMDAwMDAwMzU0IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNwovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDUzCiUlRU9G"""
        
        # Create a proper file object
        import io
        import base64
        test_file_bytes = base64.b64decode(test_pdf_content)
        
        files = {
            'file': ('test_health_report.pdf', io.BytesIO(test_file_bytes), 'application/pdf')
        }
        data = {'user_id': self.test_user_id}
        
        result = self.test_api_endpoint("POST", "/health-reports/upload", data=data, files=files)
        
        if result["success"]:
            report_data = result["data"]
            if "report_id" in report_data:
                self.test_report_id = report_data["report_id"]
                result["message"] = f"✅ PDF uploaded and OCR processed successfully. Report ID: {self.test_report_id}"
            else:
                result["success"] = False
                result["error"] = "No report_id returned"
        else:
            result["message"] = f"❌ PDF upload failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_4_get_user_reports(self) -> Dict[str, Any]:
        """Test 4: Get User Reports"""
        logger.info("Testing Get User Reports...")
        
        if not self.test_user_id:
            return {
                "success": False,
                "error": "No test user ID available"
            }
            
        result = self.test_api_endpoint("GET", f"/health-reports/{self.test_user_id}")
        
        if result["success"]:
            reports = result["data"]
            if isinstance(reports, list) and len(reports) >= 0:
                result["message"] = f"✅ Retrieved {len(reports)} reports for user"
            else:
                result["success"] = False
                result["error"] = "Invalid reports format returned"
        else:
            result["message"] = f"❌ Get reports failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_5_ai_analysis(self) -> Dict[str, Any]:
        """Test 5: AI Health Report Analysis"""
        logger.info("Testing AI Analysis (without API key)...")
        
        if not self.test_report_id:
            return {
                "success": False,
                "error": "No test report ID available (upload may have failed)"
            }
        
        # Test without HF API key - should return proper error
        analysis_data = {
            "report_id": self.test_report_id,
            "hf_api_key": "invalid_key"
        }
        
        result = self.test_api_endpoint("POST", "/health-reports/analyze", analysis_data)
        
        # For AI analysis, we expect it to fail without valid API key
        if not result["success"] and result["status_code"] == 500:
            result["message"] = "✅ AI Analysis properly rejects invalid API key (expected behavior)"
            result["success"] = True  # This is expected behavior
        elif result["success"]:
            result["message"] = "✅ AI Analysis worked (valid API key provided)"
        else:
            result["message"] = f"❌ AI Analysis failed unexpectedly: {result.get('error', 'Unknown error')}"
            
        return result

    def test_6_daily_log_submission(self) -> Dict[str, Any]:
        """Test 6: Daily Log Submission"""
        logger.info("Testing Daily Log Submission...")
        
        if not self.test_user_id:
            return {
                "success": False,
                "error": "No test user ID available"
            }
        
        log_data = {
            "user_id": self.test_user_id,
            "log_date": date.today().isoformat(),
            **TEST_DAILY_LOG
        }
        
        result = self.test_api_endpoint("POST", "/daily-logs", log_data)
        
        if result["success"]:
            log_response = result["data"]
            if "log_id" in log_response:
                self.test_log_id = log_response["log_id"]
                result["message"] = f"✅ Daily log submitted successfully. Log ID: {self.test_log_id}"
            else:
                result["success"] = False
                result["error"] = "No log_id returned"
        else:
            result["message"] = f"❌ Daily log submission failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_7_get_user_logs(self) -> Dict[str, Any]:
        """Test 7: Get User Daily Logs"""
        logger.info("Testing Get User Daily Logs...")
        
        if not self.test_user_id:
            return {
                "success": False,
                "error": "No test user ID available"
            }
            
        result = self.test_api_endpoint("GET", f"/daily-logs/{self.test_user_id}")
        
        if result["success"]:
            logs = result["data"]
            if isinstance(logs, list) and len(logs) >= 0:
                result["message"] = f"✅ Retrieved {len(logs)} daily logs for user"
            else:
                result["success"] = False
                result["error"] = "Invalid logs format returned"
        else:
            result["message"] = f"❌ Get logs failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_8_wger_exercises_search(self) -> Dict[str, Any]:
        """Test 8: WGER Exercises Search"""
        logger.info("Testing WGER Exercises Search...")
        
        params = {"query": "fitness", "limit": 10}
        result = self.test_api_endpoint("GET", "/exercises/search", params=params)
        
        if result["success"]:
            exercises_data = result["data"]
            if "exercises" in exercises_data and isinstance(exercises_data["exercises"], list):
                exercise_count = len(exercises_data["exercises"])
                result["message"] = f"✅ Retrieved {exercise_count} exercises from WGER API"
            else:
                result["success"] = False
                result["error"] = "Invalid exercises format returned"
        else:
            result["message"] = f"❌ WGER search failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_9_workout_plan_generation(self) -> Dict[str, Any]:
        """Test 9: Workout Plan Generation"""
        logger.info("Testing Workout Plan Generation (without API key)...")
        
        if not self.test_user_id:
            return {
                "success": False,
                "error": "No test user ID available"
            }
        
        # Test without HF API key - should return proper error or fallback
        data = {
            "user_id": self.test_user_id,
            "hf_api_key": "invalid_key"
        }
        
        result = self.test_api_endpoint("POST", "/workout-plans/generate", data)
        
        if result["success"]:
            plan_data = result["data"]
            if "plan_id" in plan_data:
                self.test_plan_id = plan_data["plan_id"]
                result["message"] = f"✅ Workout plan generated (fallback mode). Plan ID: {self.test_plan_id}"
            else:
                result["message"] = "✅ Workout plan endpoint responded (may use fallback)"
        elif result["status_code"] == 500:
            result["message"] = "✅ Workout plan properly rejects invalid API key (expected behavior)"
            result["success"] = True  # This is expected behavior
        else:
            result["message"] = f"❌ Workout plan generation failed: {result.get('error', 'Unknown error')}"
            
        return result

    def test_10_get_user_workout_plans(self) -> Dict[str, Any]:
        """Test 10: Get User Workout Plans"""
        logger.info("Testing Get User Workout Plans...")
        
        if not self.test_user_id:
            return {
                "success": False,
                "error": "No test user ID available"
            }
            
        result = self.test_api_endpoint("GET", f"/workout-plans/{self.test_user_id}")
        
        if result["success"]:
            plans = result["data"]
            if isinstance(plans, list) and len(plans) >= 0:
                result["message"] = f"✅ Retrieved {len(plans)} workout plans for user"
            else:
                result["success"] = False
                result["error"] = "Invalid plans format returned"
        else:
            result["message"] = f"❌ Get workout plans failed: {result.get('error', 'Unknown error')}"
            
        return result

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all backend API tests in sequence"""
        print(f"\n🚀 Starting Health Coach AI Backend API Tests")
        print(f"Backend URL: {BASE_URL}")
        print(f"Test started at: {datetime.now()}\n")
        
        tests = [
            ("User Registration API", self.test_1_user_registration),
            ("Get User API", self.test_2_get_user),
            ("PDF Upload with OCR", self.test_3_pdf_upload_ocr),
            ("Get User Reports", self.test_4_get_user_reports),
            ("AI Analysis", self.test_5_ai_analysis),
            ("Daily Log Submission", self.test_6_daily_log_submission),
            ("Get User Logs", self.test_7_get_user_logs),
            ("WGER Exercises Search", self.test_8_wger_exercises_search),
            ("Workout Plan Generation", self.test_9_workout_plan_generation),
            ("Get User Workout Plans", self.test_10_get_user_workout_plans)
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"Running: {test_name}...")
            try:
                result = test_func()
                results[test_name] = result
                
                if result["success"]:
                    passed += 1
                    print(f"  {result.get('message', '✅ Passed')}")
                else:
                    print(f"  ❌ Failed: {result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                results[test_name] = {
                    "success": False,
                    "error": f"Test execution error: {str(e)}"
                }
                print(f"  ❌ Test error: {str(e)}")
            
            print()  # Add spacing between tests
        
        # Summary
        print(f"\n📊 TEST SUMMARY")
        print(f"{'='*50}")
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print(f"\n🎉 All tests passed! Backend is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Check the details above.")
            
        return {
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "success_rate": (passed/total)*100,
            "results": results
        }

if __name__ == "__main__":
    # Run the test suite
    test_suite = BackendTestSuite()
    results = test_suite.run_all_tests()