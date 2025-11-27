import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()


# Define the data payload
data = {
    "api_id": os.getenv("SMS_API_ID"),
    "api_password": os.getenv("SMS_API_PASS"),
    "sms_type": "Transactional",
    "sms_encoding": "1",
    "sender": os.getenv("SMS_SENDER_ID"),
    "number": "9573525695",
    "message": f"Your OTP for login is {123456}",
}

# Convert the data to a JSON string
data_string = json.dumps(data)

# Define the URL for the API endpoint
url = "https://www.bulksmsplans.com/api/send_sms"

# Make the POST request
response = requests.post(
    url,
    data=data_string,
    headers={
        "Content-Type": "application/json",
        "Content-Length": str(len(data_string)),
    },
)

# Print the result
print("Status Code:", response.status_code)
print("Headers:", response.headers)
print("Raw Text:", response.text)

# Try to decode JSON if possible
try:
    print("JSON:", response.json())
except Exception as e:
    print("JSON Decode Error:", e)

print("DATA: ---- \n")
print(data)
