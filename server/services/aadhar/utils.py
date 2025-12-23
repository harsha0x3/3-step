import bcrypt


class AadharConfig:
    SALT_ROUNDS = 12


def hash_aadhar_number(plain_aadhar_number: str) -> str:
    # if not _validate_aadhar_number_strength(plain_aadhar_number):
    #     raise ValueError("aadhar_number doesn't meet requirements")
    salt = bcrypt.gensalt(rounds=AadharConfig.SALT_ROUNDS)
    aadhar_number_bytes = plain_aadhar_number.encode("utf-8")
    hashed = bcrypt.hashpw(aadhar_number_bytes, salt)

    return hashed.decode("utf-8")


def verify_aadhar_number_service(
    plain_aadhar_number: str, hashed_aadhar_number: str
) -> bool:
    try:
        aadhar_number_bytes = plain_aadhar_number.encode("utf-8")
        hashed_bytes = hashed_aadhar_number.encode("utf-8")
        return bcrypt.checkpw(aadhar_number_bytes, hashed_bytes)
    except Exception:
        return False
