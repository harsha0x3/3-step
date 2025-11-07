from pydantic_settings import BaseSettings, SettingsConfigDict


class DBConfig(BaseSettings):
    DATABASE_URL: str
    POOL_SIZE: int
    MAX_OVERFLOW: int
    POOL_TIMEOUT: int
    POOL_RECYCLE: int

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


Config = DBConfig()  # type:ignore
