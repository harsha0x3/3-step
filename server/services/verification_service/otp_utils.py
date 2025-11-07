import random


def generate_otp() -> str:
    otp = random.randint(100000, 999999)
    return str(otp)


def verify_otp(original_otp: str, recieved_otp: str) -> bool:
    return original_otp == recieved_otp
