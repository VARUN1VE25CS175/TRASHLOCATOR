import requests
import sys
import json
from datetime import datetime

class DustbinAPITester:
    def __init__(self, base_url="https://trashlocator.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json() if success else response.text}"
            self.log_test("Root API Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root API Endpoint", False, f"Error: {str(e)}")
            return False

    def test_admin_login_valid(self):
        """Test admin login with valid password"""
        try:
            data = {"password": "admin123"}
            response = requests.post(f"{self.api_url}/admin/login", json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("token"):
                    self.token = result["token"]
                    self.log_test("Admin Login (Valid)", True, f"Token received: {self.token[:20]}...")
                    return True
                else:
                    self.log_test("Admin Login (Valid)", False, f"Login failed: {result}")
                    return False
            else:
                self.log_test("Admin Login (Valid)", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Login (Valid)", False, f"Error: {str(e)}")
            return False

    def test_admin_login_invalid(self):
        """Test admin login with invalid password"""
        try:
            data = {"password": "wrongpassword"}
            response = requests.post(f"{self.api_url}/admin/login", json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                success = not result.get("success")
                self.log_test("Admin Login (Invalid)", success, f"Response: {result}")
                return success
            else:
                self.log_test("Admin Login (Invalid)", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Login (Invalid)", False, f"Error: {str(e)}")
            return False

    def test_get_dustbins_empty(self):
        """Test getting dustbins when none exist"""
        try:
            response = requests.get(f"{self.api_url}/dustbins", timeout=10)
            success = response.status_code == 200
            dustbins = response.json() if success else []
            self.log_test("Get Dustbins (Empty)", success, f"Status: {response.status_code}, Count: {len(dustbins)}")
            return success, dustbins
        except Exception as e:
            self.log_test("Get Dustbins (Empty)", False, f"Error: {str(e)}")
            return False, []

    def test_create_dustbin(self):
        """Test creating a new dustbin"""
        if not self.token:
            self.log_test("Create Dustbin", False, "No admin token available")
            return False, None

        try:
            data = {
                "name": "Test Dustbin 1",
                "description": "Test dustbin for API testing",
                "latitude": 28.6139,
                "longitude": 77.2090
            }
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{self.api_url}/dustbins", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                dustbin = response.json()
                dustbin_id = dustbin.get("id")
                self.log_test("Create Dustbin", True, f"Created dustbin ID: {dustbin_id}")
                return True, dustbin_id
            else:
                self.log_test("Create Dustbin", False, f"Status: {response.status_code}, Response: {response.text}")
                return False, None
        except Exception as e:
            self.log_test("Create Dustbin", False, f"Error: {str(e)}")
            return False, None

    def test_create_dustbin_unauthorized(self):
        """Test creating dustbin without authorization"""
        try:
            data = {
                "name": "Unauthorized Dustbin",
                "description": "This should fail",
                "latitude": 28.6139,
                "longitude": 77.2090
            }
            response = requests.post(f"{self.api_url}/dustbins", json=data, timeout=10)
            success = response.status_code == 401
            self.log_test("Create Dustbin (Unauthorized)", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Create Dustbin (Unauthorized)", False, f"Error: {str(e)}")
            return False

    def test_get_dustbins_with_data(self):
        """Test getting dustbins when data exists"""
        try:
            response = requests.get(f"{self.api_url}/dustbins", timeout=10)
            success = response.status_code == 200
            dustbins = response.json() if success else []
            self.log_test("Get Dustbins (With Data)", success, f"Status: {response.status_code}, Count: {len(dustbins)}")
            return success, dustbins
        except Exception as e:
            self.log_test("Get Dustbins (With Data)", False, f"Error: {str(e)}")
            return False, []

    def test_update_dustbin(self, dustbin_id):
        """Test updating an existing dustbin"""
        if not self.token or not dustbin_id:
            self.log_test("Update Dustbin", False, "No admin token or dustbin ID available")
            return False

        try:
            data = {
                "name": "Updated Test Dustbin",
                "description": "Updated description for testing",
                "latitude": 28.7041,
                "longitude": 77.1025
            }
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.put(f"{self.api_url}/dustbins/{dustbin_id}", json=data, headers=headers, timeout=10)
            
            success = response.status_code == 200
            self.log_test("Update Dustbin", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Update Dustbin", False, f"Error: {str(e)}")
            return False

    def test_update_dustbin_unauthorized(self, dustbin_id):
        """Test updating dustbin without authorization"""
        if not dustbin_id:
            self.log_test("Update Dustbin (Unauthorized)", False, "No dustbin ID available")
            return False

        try:
            data = {
                "name": "Unauthorized Update",
                "description": "This should fail",
                "latitude": 28.6139,
                "longitude": 77.2090
            }
            response = requests.put(f"{self.api_url}/dustbins/{dustbin_id}", json=data, timeout=10)
            success = response.status_code == 401
            self.log_test("Update Dustbin (Unauthorized)", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Update Dustbin (Unauthorized)", False, f"Error: {str(e)}")
            return False

    def test_nearest_dustbin(self):
        """Test finding nearest dustbin"""
        try:
            # Test with coordinates near Delhi
            lat, lng = 28.6139, 77.2090
            response = requests.get(f"{self.api_url}/dustbins/nearest?lat={lat}&lng={lng}", timeout=10)
            
            success = response.status_code == 200
            if success:
                result = response.json()
                has_dustbin = result.get("dustbin") is not None
                distance = result.get("distance_km")
                details = f"Found dustbin: {has_dustbin}, Distance: {distance} km"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Nearest Dustbin", success, details)
            return success
        except Exception as e:
            self.log_test("Nearest Dustbin", False, f"Error: {str(e)}")
            return False

    def test_delete_dustbin_unauthorized(self, dustbin_id):
        """Test deleting dustbin without authorization"""
        if not dustbin_id:
            self.log_test("Delete Dustbin (Unauthorized)", False, "No dustbin ID available")
            return False

        try:
            response = requests.delete(f"{self.api_url}/dustbins/{dustbin_id}", timeout=10)
            success = response.status_code == 401
            self.log_test("Delete Dustbin (Unauthorized)", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Delete Dustbin (Unauthorized)", False, f"Error: {str(e)}")
            return False

    def test_delete_dustbin(self, dustbin_id):
        """Test deleting a dustbin"""
        if not self.token or not dustbin_id:
            self.log_test("Delete Dustbin", False, "No admin token or dustbin ID available")
            return False

        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.delete(f"{self.api_url}/dustbins/{dustbin_id}", headers=headers, timeout=10)
            
            success = response.status_code == 200
            self.log_test("Delete Dustbin", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Delete Dustbin", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🧪 Starting Dustbin API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 50)

        # Test basic connectivity
        if not self.test_root_endpoint():
            print("❌ Root endpoint failed - stopping tests")
            return self.get_summary()

        # Test authentication
        self.test_admin_login_valid()
        self.test_admin_login_invalid()

        # Test dustbin operations
        success, initial_dustbins = self.test_get_dustbins_empty()
        
        # Test unauthorized operations
        self.test_create_dustbin_unauthorized()
        
        # Test authorized operations
        create_success, dustbin_id = self.test_create_dustbin()
        
        if create_success and dustbin_id:
            # Test with data
            self.test_get_dustbins_with_data()
            self.test_nearest_dustbin()
            
            # Test update operations
            self.test_update_dustbin_unauthorized(dustbin_id)
            self.test_update_dustbin(dustbin_id)
            
            # Test delete operations
            self.test_delete_dustbin_unauthorized(dustbin_id)
            self.test_delete_dustbin(dustbin_id)

        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed")
            failed_tests = [r for r in self.test_results if not r["success"]]
            for test in failed_tests:
                print(f"   ❌ {test['test']}: {test['details']}")
            return False

def main():
    tester = DustbinAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': tester.tests_passed / tester.tests_run if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'test_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())