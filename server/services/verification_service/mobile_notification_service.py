import httpx
import time
import os
from models.schemas.otp_schemas import SmsOtpPayload
from fastapi import HTTPException, status

auth_url = os.getenv("SMS_AUTH_URL", "")
auth_payload = {
    "grant_type": "client_credentials",
    "client_id": os.getenv("SMS_CLIENT_ID", ""),
    "client_secret": os.getenv("SMS_CLIENT_SECRET", ""),
    "account_id": os.getenv("SMS_ACCOUNT_ID"),
}
auth_headers = {"Content-Type": "application/json"}


async def send_beneficiary_sms_otp(payload: SmsOtpPayload):
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            auth_res = await client.post(
                auth_url, headers=auth_headers, json=auth_payload
            )
            auth_res.raise_for_status()
            access_token = auth_res.json()["access_token"]
            message_key = f"otp_{int(time.time())}"
            sms_url = f"https://mcg6x3ltbxc45628qg689txfg4dm.rest.marketingcloudapis.com/messaging/v1/sms/messages/{message_key}"

            sms_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            }
            sms_payload = {
                "definitionKey": "MD_LAPDIST",
                "recipient": {
                    "to": f"91{payload.mobile_number}",
                    "contactKey": f"91{payload.mobile_number}",
                    "attributes": {
                        "message": f"Your OTP is {payload.otp} for receiving the laptop. Please do not share it with anyone, other than croma store person. Titan Company Ltd.",
                        "FromName": "TITAN",
                    },
                },
                "subscriptions": {"resubscribe": True},
                "content": {"message": "%%message%%"},
            }

            sms_response = await client.post(
                sms_url, headers=sms_headers, json=sms_payload
            )

            print("sms data", sms_response.json())

            if sms_response.status_code not in (200, 202):
                raise ValueError(
                    f"SMS send failed: {sms_response.status_code}, {sms_response.text}"
                )

            return {
                "status": sms_response.status_code,
                "messageKey": message_key,
                "response": sms_response.json(),
            }

    except Exception as e:
        # optionally wrap into your custom error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "OTP sending failed", "err_stack": str(e)},
        )


async def send_login_sms_otp(payload: SmsOtpPayload):
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            auth_res = await client.post(
                auth_url, headers=auth_headers, json=auth_payload
            )
            auth_res.raise_for_status()
            access_token = auth_res.json()["access_token"]
            message_key = f"otp_{int(time.time())}"
            sms_url = f"https://mcg6x3ltbxc45628qg689txfg4dm.rest.marketingcloudapis.com/messaging/v1/sms/messages/{message_key}"

            sms_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            }
            sms_payload = {
                "definitionKey": "MD_LAPDIST",
                "recipient": {
                    "to": f"91{payload.mobile_number}",
                    "contactKey": f"91{payload.mobile_number}",
                    "attributes": {
                        "message": f"Your OTP is {payload.otp} for receiving the laptop. Please do not share it with anyone, other than croma store person. Titan Company Ltd.",
                        "FromName": "TITAN",
                    },
                },
                "subscriptions": {"resubscribe": True},
                "content": {"message": "%%message%%"},
            }

            sms_response = await client.post(
                sms_url, headers=sms_headers, json=sms_payload
            )

            print("SMS RES", sms_response.json())

            if sms_response.status_code not in (200, 202):
                raise ValueError(
                    f"SMS send failed: {sms_response.status_code}, {sms_response.text}"
                )

            return {
                "status": sms_response.status_code,
                "messageKey": message_key,
                "response": sms_response.json(),
            }

    except Exception as e:
        # optionally wrap into your custom error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "OTP sending failed", "err_stack": str(e)},
        )
