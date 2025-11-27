import os
from msal import ConfidentialClientApplication
import httpx
from dotenv import load_dotenv
import json

from models.schemas.otp_schemas import CandidateInOtp, AdminOTPPayload
from fastapi import HTTPException, status
from typing import Any


load_dotenv()

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
tenant_id = os.getenv("TENANT_ID")
email_sender = os.getenv("EMAIL_ADDRESS")
admin_email = os.getenv("ADMIN_MAIL")

authority = f"https://login.microsoftonline.com/{tenant_id}"
scopes = ["https://graph.microsoft.com/.default"]
graph_endpoint = f"https://graph.microsoft.com/v1.0/users/{email_sender}/sendMail"


def fetch_token():
    """Fetch Microsoft Graph access token using MSAL."""
    app = ConfidentialClientApplication(
        client_id, authority=authority, client_credential=client_secret
    )

    result = app.acquire_token_for_client(scopes=scopes)
    if not result:
        return {"success": False}
    return {"success": True, "token": result.get("access_token")}


async def send_otp_email(email_payload: CandidateInOtp) -> dict[str, Any] | None:
    try:
        token = fetch_token()
        if not token.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access token not found for sending mail",
            )
        access_token = token["token"]

        html_body = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial, Helvetica, sans-serif;">
  <!-- Preheader (hidden in most clients but shown in inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#ffffff;">
    Your verification code for {email_payload.store_name} — expires in {email_payload.expiry_minutes} minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:20px 28px;background:#0b73ff;color:#ffffff;text-align:left;">
              <h1 style="margin:0;font-size:20px;line-height:1.2;">{email_payload.store_name}</h1>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">Verification code for your identity confirmation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:15px;color:#333333;">
                Hello <strong>{email_payload.candidate_name}</strong>,
              </p>

              <p style="margin:0 0 22px;font-size:14px;color:#555555;">
                Use the code below to complete your verification at <strong>{email_payload.store_name}</strong>. This code will expire in <strong>{email_payload.expiry_minutes} minutes</strong>.
              </p>

              <!-- OTP block -->
              <div style="text-align:center;margin:18px 0 22px;">
                <div style="display:inline-block;background:#f7f9ff;border:1px solid #e6eefc;padding:18px 24px;border-radius:8px;">
                  <p style="margin:0;font-size:20px;letter-spacing:4px;font-weight:700;color:#0b73ff;">
                    {email_payload.otp}
                  </p>
                </div>
              </div>

              <p style="margin:0 0 12px;font-size:13.5px;color:#555555;">
                Enter this code in the verification screen at the store. If you didn't request this, please ignore this email or contact support.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:18px;">
                <tr>
                  <td style="vertical-align:top;padding-right:12px;font-size:13px;color:#666666;width:50%;">
                    <strong>Store</strong><br/>
                    {email_payload.store_name}<br/>
                    {email_payload.store_address_line}<br/>
                  </td>
                  <td style="vertical-align:top;padding-left:12px;font-size:13px;color:#666666;">
                    <strong>Support</strong><br/>
                    Email: <a href="mailto:{email_payload.support_email}" style="color:#0b73ff;text-decoration:none;">{email_payload.support_email}</a><br/>
                    Phone: <a href="tel:{email_payload.support_phone}" style="color:#0b73ff;text-decoration:none;">{email_payload.support_phone}</a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #eef2f6;margin:22px 0;"/>

              <p style="margin:0;font-size:12.5px;color:#8a8f95;line-height:1.4;">
                Security tip: Never share this code with anyone. {email_payload.store_name} will never ask for your password. This email is for verification only.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;background:#fbfdff;text-align:center;font-size:12px;color:#9aa3b2;">
              © 2025 {email_payload.store_name} — All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        email_msg = {
            "Message": {
                "Subject": "OTP for identity verification - Laptop Distribution.",
                "Body": {"ContentType": "HTML", "Content": html_body},
                "ToRecipients": [
                    {"EmailAddress": {"Address": email_payload.candidate_email}}
                ],
            },
            "SaveToSentItems": "true",
        }

        for i in range(3):
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    graph_endpoint,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    content=json.dumps(email_msg),
                )

                if response.status_code == 202:
                    # print({"success": True, "status_code": response.status_code})
                    return {"success": True, "status_code": response.status_code}
                else:
                    # print({"success": False, "status_code": response.status_code})
                    # print(response.__dict__)
                    continue
            return {"success": False, "status_code": response.status_code}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error sending email", "err_stack": str(e)},
        )


async def send_otp_to_admin(email_payload: AdminOTPPayload):
    try:
        token = fetch_token()
        if not token.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access token not found for sending mail",
            )
        access_token = token["token"]
        html_body = f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin OTP Alert</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <!-- Preheader -->
    <div style="display: none; max-height: 0; overflow: hidden; color: #ffffff">
      Store {email_payload.store_name} has requested OTP from you. Kindly, share
      the OTP with authorised store agent.
    </div>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="padding: 24px 0"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  padding: 20px 28px;
                  background: #b11226;
                  color: #ffffff;
                  text-align: left;
                "
              >
                <h1 style="margin: 0; font-size: 20px; line-height: 1.2">
                  Laptop Distribution - OTP
                </h1>
                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95">
                  OTP request initiated for beneficiary approval at store.
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 28px">
                <p style="margin: 0 0 14px; font-size: 15px; color: #333333">
                  Hello <strong>Administrator</strong>,
                </p>

                <p style="margin: 0 0 22px; font-size: 14px; color: #555555">
                  An OTP has been generated to verify the following beneficiary
                  at
                  <strong>{email_payload.store_name}</strong>. This OTP will
                  expire in
                  <strong>{email_payload.expiry_minutes} minutes</strong>.
                </p>

                <!-- OTP Block -->
                <div style="text-align: center; margin: 18px 0 22px">
                  <div
                    style="
                      display: inline-block;
                      background: #fef3f3;
                      border: 1px solid #f5c6cb;
                      padding: 18px 24px;
                      border-radius: 8px;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 20px;
                        letter-spacing: 4px;
                        font-weight: 700;
                        color: #b11226;
                      "
                    >
                      {email_payload.otp}
                    </p>
                  </div>
                </div>

                <p style="margin: 18px 0 12px; font-size: 13.5px; color: #555">
                  Please validate the beneficiary details before proceeding with
                  approval and sharing the OTP.
                </p>

                <!-- Beneficiary Details -->
                <h3 style="font-size: 15px; color: #333; margin-bottom: 8px">
                  Beneficiary Details
                </h3>

                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    background: #fafafa;
                    border-radius: 6px;
                    border: 1px solid #e5e5e5;
                    font-size: 13.5px;
                    color: #555;
                  "
                >
                  <tr>
                    <td style="padding: 10px">
                      <strong>Beneficiary ID:</strong>
                    </td>
                    <td style="padding: 10px">
                      {email_payload.beneficiary_id}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px"><strong>Name:</strong></td>
                    <td style="padding: 10px">
                      {email_payload.beneficiary_name}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px"><strong>Phone:</strong></td>
                    <td style="padding: 10px">
                      {email_payload.beneficiary_phone}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px"><strong>Store:</strong></td>
                    <td style="padding: 10px">{email_payload.store_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px">
                      <strong>Store Address:</strong>
                    </td>
                    <td style="padding: 10px">{email_payload.store_address}</td>
                  </tr>
                </table>

                <hr
                  style="
                    border: none;
                    border-top: 1px solid #eef2f6;
                    margin: 22px 0;
                  "
                />

                <p
                  style="
                    margin: 0;
                    font-size: 12.5px;
                    color: #8a8f95;
                    line-height: 1.4;
                  "
                >
                  Security Notice: This OTP is confidential and intended for
                  authorized personnel only. Do not forward this email or share
                  the code.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""
        email_msg = {
            "Message": {
                "Subject": "OTP for identity verification - Laptop Distribution.",
                "Body": {"ContentType": "HTML", "Content": html_body},
                "ToRecipients": [{"EmailAddress": {"Address": admin_email}}],
            },
            "SaveToSentItems": "true",
        }
        for i in range(3):
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    graph_endpoint,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    content=json.dumps(email_msg),
                )

                if response.status_code == 202:
                    # print({"success": True, "status_code": response.status_code})
                    return {"success": True, "status_code": response.status_code}
                else:
                    # print({"success": False, "status_code": response.status_code})
                    # print(response.__dict__)
                    continue
            return {"success": False, "status_code": response.status_code}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error sending email", "err_stack": str(e)},
        )


# from pydantic import BaseModel
# import asyncio
# class CandidateInOtp(BaseModel):
#     otp: str
#     candidate_name: str
#     candidate_email: str
#     expiry_minutes: str
#     store_name: str
#     store_address_line: str
#     store_city: str
#     store_state: str
#     support_email: str
#     support_phone: str

# if __name__ == "__main__":
#     payload = CandidateInOtp(
#         otp="123456",
#         candidate_name="Harsha Vardhan",
#         candidate_email="cgharshavardhan05@gmail.com",
#         expiry_minutes="2",
#         store_name="The Store",
#         store_address_line="Electronic city Phase -1, Bengaluru, Karnataka",
#         store_city="Bengaluru",
#         store_state="Karnataka",
#         support_email="support_mail@gmail.com",
#         support_phone="9595959595",
#     )

#     asyncio.run(send_otp_email(payload))


async def send_password_reset_email(
    email: str, full_name: str, otp: str
) -> dict[str, Any]:
    """Send password reset OTP email"""
    try:
        token = fetch_token()
        if not token.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access token not found for sending mail",
            )
        access_token = token["token"]

        html_body = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:20px 28px;background:#0b73ff;color:#ffffff;text-align:left;">
              <h1 style="margin:0;font-size:20px;line-height:1.2;">Password Reset Request</h1>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">Laptop Distribution System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:15px;color:#333333;">
                Hello <strong>{full_name}</strong>,
              </p>

              <p style="margin:0 0 22px;font-size:14px;color:#555555;">
                We received a request to reset your password. Use the code below to complete the process. This code will expire in <strong>20 minutes</strong>.
              </p>

              <!-- OTP block -->
              <div style="text-align:center;margin:18px 0 22px;">
                <div style="display:inline-block;background:#f7f9ff;border:1px solid #e6eefc;padding:18px 24px;border-radius:8px;">
                  <p style="margin:0;font-size:28px;letter-spacing:4px;font-weight:700;color:#0b73ff;">
                    {otp}
                  </p>
                </div>
              </div>

              <p style="margin:0 0 12px;font-size:13.5px;color:#555555;">
                If you didn't request a password reset, please ignore this email or contact your administrator if you have concerns.
              </p>

              <hr style="border:none;border-top:1px solid #eef2f6;margin:22px 0;"/>

              <p style="margin:0;font-size:12.5px;color:#8a8f95;line-height:1.4;">
                Security tip: Never share this code with anyone. This code can only be used once to reset your password.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;background:#fbfdff;text-align:center;font-size:12px;color:#9aa3b2;">
              © 2025 Laptop Distribution System — All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        email_msg = {
            "Message": {
                "Subject": "Password Reset Request - Laptop Distribution System",
                "Body": {"ContentType": "HTML", "Content": html_body},
                "ToRecipients": [{"EmailAddress": {"Address": email}}],
            },
            "SaveToSentItems": "true",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                graph_endpoint,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                content=json.dumps(email_msg),
            )

            if response.status_code == 202:
                return {"success": True}
            else:
                return {"success": False}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error sending password reset email", "err_stack": str(e)},
        )
