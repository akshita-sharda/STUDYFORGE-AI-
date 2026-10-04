import os


class Settings:
    app_name = "ASHIEY"
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    vector_store_dir = os.getenv("VECTOR_STORE_DIR", "vector_store")


settings = Settings()
