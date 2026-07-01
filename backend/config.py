SECRET_KEY = "super-secret-key"
JWT_SECRET = "jwt-secret-key"
SQLALCHEMY_DATABASE_URI = "sqlite:///users.db"
SQLALCHEMY_TRACK_MODIFICATIONS = False

UPLOAD_FOLDER = "uploads"
MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2 MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}