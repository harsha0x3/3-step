import requests
import json

# Define the data payload
data = {
    "api_id": "",
    "api_password": "",
    "sms_type": "",
    "sms_encoding": "",
    "sender": "",
    "number": "",
    "message": "Hello Guys, Congratualatuion ! you are getting new rank in Alexa",
    "template_id": "",
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
print(response.text)
