# from werkzeug.security import generate_password_hash

# pswd = generate_password_hash("harsha")
# print(pswd)
# import pyotp


# def generate_mfa_secret():
#     """Generate a new MFA secret for a user"""
#     return pyotp.random_base32()


# print(generate_mfa_secret())

import pyotp
import qrcode


def generate_qr_code(email, secret, issuer="DLP-Security Management"):
    """Generate QR code for MFA setup and save it as a PNG file"""
    # Generate TOTP URI (used by Google Authenticator, Authy, etc.)
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)

    # Create QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)

    # Create image
    img = qr.make_image(fill_color="black", back_color="white")

    # Save image to disk
    img.save("qr.png")  # You can change the name/path here

    print("✅ QR code saved as qr.png")


# Example usage:
generate_qr_code("harshavardhancg@titan.co.in", "JBSWY3DPEHPK3PXP")
