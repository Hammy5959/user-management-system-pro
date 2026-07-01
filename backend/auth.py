import jwt
import random
from datetime import datetime, timedelta
from flask import request, jsonify
from config import JWT_SECRET
from models import User
from functools import wraps

OTP_STORE = {}  # { email: otp }


def get_current_user():
    """Extract current User from JWT in Authorization header, or None."""
    token = request.headers.get("Authorization")
    if not token:
        return None
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None
    return User.query.get(data["id"])


def is_super_admin(user):
    """Check if a user has the super_admin role."""
    return user and user.role and user.role.name == "super_admin"


def generate_otp(email):
    otp = str(random.randint(100000, 999999))
    OTP_STORE[email] = otp
    print("OTP:", otp)  # replace with email service in production
    return otp


def create_jwt(user):
    payload = {
        "id": user.id,
        "role": user.role.name if user.role else "user",
        "permissions": [p.name for p in user.role.permissions] if user.role else [],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def permission_required(permission_name):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            token = request.headers.get("Authorization")
            if not token:
                return jsonify({"msg": "Token missing"}), 401
            try:
                data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            except Exception:
                return jsonify({"msg": "Invalid token"}), 401

            user = User.query.get(data["id"])
            if not user:
                return jsonify({"msg": "User not found"}), 404

            # Super Admin bypasses all permission checks
            if user.role and user.role.name == "super_admin":
                return fn(*args, **kwargs)

            permissions = [p.name for p in user.role.permissions] if user.role else []
            if permission_name not in permissions:
                return jsonify({"msg": "Permission denied"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
