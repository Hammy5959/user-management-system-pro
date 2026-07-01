import jwt
import os
import uuid
from flask import request, jsonify
from models import User, Permission, Role, db
from auth import generate_otp, create_jwt, permission_required, get_current_user, is_super_admin, OTP_STORE
from config import JWT_SECRET, ALLOWED_EXTENSIONS, MAX_CONTENT_LENGTH
from werkzeug.security import generate_password_hash, check_password_hash
import re

EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
PK_PHONE_REGEX = r"^(\+92|0)?3\d{9}$"
PASSWORD_REGEX = (
    r"^(?=.*[0-9])(?=.*[!@#$%^&*()_\-+=?])[A-Za-z0-9!@#$%^&*()_\-+=?]{8,20}$"
)


def register_routes(app):

    # ---------------- LOGIN ----------------
    @app.route("/login", methods=["POST"])
    def login():
        email = request.json.get("email")
        password = request.json.get("password")

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "Invalid email", "error": "email"}), 404

        if not check_password_hash(user.password, password):
            return jsonify({"msg": "Invalid password", "error": "password"}), 401

        if not user.is_active:
            return jsonify({"msg": "Account is deactivated. Contact an administrator.", "error": "inactive"}), 403

        generate_otp(email)
        return jsonify({"msg": "OTP sent"})

    # ---------------- VERIFY OTP ----------------
    @app.route("/verify-otp", methods=["POST"])
    def verify_otp():
        email = request.json.get("email")
        otp = request.json.get("otp")

        if OTP_STORE.get(email) != otp:
            return jsonify({"msg": "Invalid OTP"}), 400

        user = User.query.filter_by(email=email).first()
        token = create_jwt(user)

        return jsonify(
            {
                "token": token,
                "role": user.role.name if user.role else None,
                "permissions": [p.name for p in user.role.permissions] if user.role else [],
            }
        )

    # ---------------- PROFILE PICTURE UPLOAD ----------------
    @app.route("/users/me/profile-picture", methods=["POST"])
    def upload_profile_picture():
        user = get_current_user()
        if not user:
            return jsonify({"msg": "Unauthorized"}), 401

        if "file" not in request.files:
            return jsonify({"msg": "No file provided"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"msg": "No file selected"}), 400

        # Validate extension and MIME type
        original_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if original_ext not in ALLOWED_EXTENSIONS:
            return jsonify({"msg": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400

        # Validate MIME type
        allowed_mimes = {"image/jpeg", "image/png", "image/webp"}
        if file.mimetype not in allowed_mimes:
            return jsonify({"msg": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400

        # Validate file size (2 MB)
        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        if size > MAX_CONTENT_LENGTH:
            return jsonify({"msg": "File too large. Maximum size is 2 MB"}), 400

        # Generate unique filename
        unique_name = f"{uuid.uuid4().hex}.{original_ext}"

        upload_dir = os.path.join(app.root_path, "uploads", "profile_pictures")
        os.makedirs(upload_dir, exist_ok=True)

        # Delete old file if it exists
        if user.profile_picture:
            old_path = os.path.join(app.root_path, user.profile_picture)
            if os.path.exists(old_path):
                os.remove(old_path)

        # Save new file
        file.save(os.path.join(upload_dir, unique_name))

        relative_path = f"uploads/profile_pictures/{unique_name}"
        user.profile_picture = relative_path
        db.session.commit()

        return jsonify({"profile_picture": relative_path})

    # ---------------- USERS ----------------
    @app.route("/users", methods=["GET"])
    @permission_required("View Users")
    def get_users():
        name = request.args.get("name", "").strip()
        email = request.args.get("email", "").strip()

        query = User.query
        if name:
            query = query.filter(
                db.or_(
                    User.first_name.ilike(f"%{name}%"),
                    User.last_name.ilike(f"%{name}%"),
                )
            )
        if email:
            query = query.filter(User.email.ilike(f"%{email}%"))

        users = query.all()

        # Hide super_admin users from non-super-admin callers
        caller = get_current_user()
        if not is_super_admin(caller):
            users = [u for u in users if not (u.role and u.role.name == "super_admin")]

        return jsonify(
            [
                {
                    "id": u.id,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "email": u.email,
                    "phone": u.phone,
                    "role": u.role.name if u.role else None,
                    "is_active": u.is_active,
                    "profile_picture": u.profile_picture,
                    "permissions": [p.name for p in u.role.permissions] if u.role else [],
                }
                for u in users
            ]
        )

    @app.route("/users", methods=["POST"])
    @permission_required("Create Users")
    def create_user():
        data = request.json

        # Defense-in-depth: role selection is not allowed during creation
        if "role_id" in data:
            return jsonify({"msg": "Role selection is not allowed during user creation"}), 400

        if not re.match(EMAIL_REGEX, data["email"]):
            return jsonify({"msg": "Invalid email format"}), 400

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"msg": "Email already exists"}), 400

        password = data["password"]
        if not re.match(PASSWORD_REGEX, password):
            return (
                jsonify(
                    {
                        "msg": "Password must be 8-20 characters and include at least one number and one special character"
                    }
                ),
                400,
            )
        if not re.match(PK_PHONE_REGEX, data["phone"]):
            return jsonify({"msg": "Invalid phone number"}), 400

        hashed_password = generate_password_hash(password)

        # Assign default "user" role
        default_role = Role.query.filter_by(name="user").first()
        if not default_role:
            return jsonify({"msg": "Default role not found"}), 500

        user = User(
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            phone=data["phone"],
            password=hashed_password,
            role_id=default_role.id,
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"msg": "User created successfully"})

    @app.route("/users/<int:id>", methods=["PUT"])
    def update_user(id):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"msg": "Token missing"}), 401
        try:
            jwt_data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except Exception:
            return jsonify({"msg": "Invalid token"}), 401

        user = User.query.get(id)
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Resolve caller info once for all permission checks
        caller = User.query.get(jwt_data["id"])
        if not caller:
            return jsonify({"msg": "Caller not found"}), 404
        caller_perms = [p.name for p in caller.role.permissions] if caller.role else []
        has_manage_users = "Manage Users" in caller_perms
        caller_is_super_admin = is_super_admin(caller)

        data = request.json

        # ── Self-role-change prevention: a user cannot change their own role ──
        is_self_edit = caller.id == user.id
        if is_self_edit and "role_id" in data:
            del data["role_id"]

        # ── Super Admin guard: only Super Admin may edit a Super Admin user ──
        target_is_super_admin = user.role and user.role.name == "super_admin"
        if target_is_super_admin and not caller_is_super_admin:
            return jsonify({"msg": "Permission denied"}), 403

        # ── Role change (requires "Manage Users") ──
        if "role_id" in data:
            if not has_manage_users and not caller_is_super_admin:
                return jsonify({"msg": "Permission denied"}), 403

            new_role = Role.query.get(data["role_id"])
            if not new_role:
                return jsonify({"msg": "Role not found"}), 404

            # Only Super Admin may assign the super_admin role
            if new_role.name == "super_admin" and not caller_is_super_admin:
                return jsonify({"msg": "Permission denied"}), 403

            # Prevent removing the last admin
            old_role = user.role
            if old_role and old_role.name == "admin" and new_role.name != "admin":
                admin_count = User.query.filter_by(role_id=old_role.id).count()
                if admin_count <= 1:
                    return jsonify({"msg": "Cannot remove the last admin"}), 403

            # Prevent removing the last super admin
            if target_is_super_admin and new_role.name != "super_admin":
                sa_count = User.query.filter_by(role_id=user.role_id).count()
                if sa_count <= 1:
                    return jsonify({"msg": "Cannot remove the last super admin"}), 403

            user.role_id = new_role.id

        # ── Profile updates (name / email) ──
        profile_fields = [f for f in ("first_name", "last_name", "email") if f in data]
        if profile_fields and not has_manage_users and jwt_data.get("role") not in ("admin", "super_admin"):
            return jsonify({"msg": "Permission denied"}), 403

        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        if "email" in data:
            if not re.match(EMAIL_REGEX, data["email"]):
                return jsonify({"msg": "Invalid email format"}), 400
            if User.query.filter(User.email == data["email"], User.id != id).first():
                return jsonify({"msg": "Email already exists"}), 400
            user.email = data["email"]

        db.session.commit()

        return jsonify({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.name if user.role else None,
            "is_active": user.is_active,
            "profile_picture": user.profile_picture,
        })

    @app.route("/users/<int:id>", methods=["DELETE"])
    @permission_required("Delete Users")
    def delete_user(id):
        token = request.headers.get("Authorization")
        try:
            jwt_data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except Exception:
            return jsonify({"msg": "Invalid token"}), 401

        if jwt_data["id"] == id:
            return jsonify({"msg": "Cannot delete yourself"}), 403

        user = User.query.get(id)
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Super Admin protection
        if user.role and user.role.name == "super_admin":
            caller = get_current_user()
            if not is_super_admin(caller):
                return jsonify({"msg": "Permission denied"}), 403
            # Last super_admin protection
            sa_count = User.query.filter_by(role_id=user.role_id).count()
            if sa_count <= 1:
                return jsonify({"msg": "Cannot delete the last super admin"}), 403

        db.session.delete(user)
        db.session.commit()
        return jsonify({"msg": "User deleted"})

    @app.route("/users/<int:id>/toggle-status", methods=["PATCH"])
    @permission_required("Manage Users")
    def toggle_user_status(id):
        token = request.headers.get("Authorization")
        try:
            jwt_data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except Exception:
            return jsonify({"msg": "Invalid token"}), 401

        if jwt_data["id"] == id:
            return jsonify({"msg": "Cannot change your own status"}), 403

        user = User.query.get(id)
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Super Admin protection
        if user.role and user.role.name == "super_admin":
            caller = get_current_user()
            if not is_super_admin(caller):
                return jsonify({"msg": "Permission denied"}), 403
            # Last super_admin protection
            sa_count = User.query.filter_by(role_id=user.role_id).count()
            if sa_count <= 1:
                return jsonify({"msg": "Cannot deactivate the last super admin"}), 403

        if user.role and user.role.name == "admin":
            caller = get_current_user()
            if not is_super_admin(caller):
                return jsonify({"msg": "Cannot deactivate admin users"}), 403

        user.is_active = not user.is_active
        db.session.commit()

        return jsonify({"is_active": user.is_active})

    # ---------------- ROLES ----------------
    @app.route("/roles", methods=["GET"])
    @permission_required("View Users")
    def get_roles():
        roles = Role.query.all()

        # Hide super_admin role from non-super-admin callers
        caller = get_current_user()
        if not is_super_admin(caller):
            roles = [r for r in roles if r.name != "super_admin"]

        return jsonify([
            {
                "id": r.id,
                "name": r.name,
                "users_count": len(r.users),
                "permissions": [p.name for p in r.permissions],
            }
            for r in roles
        ])

    @app.route("/roles/<int:id>/permissions", methods=["GET"])
    @permission_required("View Users")
    def get_role_permissions(id):
        role = Role.query.get(id)
        if not role:
            return jsonify({"msg": "Role not found"}), 404

        # Hide super_admin role from non-super-admin callers
        if role.name == "super_admin":
            caller = get_current_user()
            if not is_super_admin(caller):
                return jsonify({"msg": "Role not found"}), 404

        return jsonify({
            "role": role.name,
            "permissions": [p.name for p in role.permissions],
        })

    @app.route("/roles/<int:id>/permissions", methods=["POST"])
    @permission_required("Manage Roles")
    def set_role_permissions(id):
        role = Role.query.get(id)
        if not role:
            return jsonify({"msg": "Role not found"}), 404

        # Only Super Admin may modify the super_admin role's permissions
        if role.name == "super_admin":
            caller = get_current_user()
            if not is_super_admin(caller):
                return jsonify({"msg": "Permission denied"}), 403

        data = request.json
        permission_names = data.get("permissions", [])

        role.permissions = []
        for p_name in permission_names:
            perm = Permission.query.filter_by(name=p_name).first()
            if perm:
                role.permissions.append(perm)

        db.session.commit()
        return jsonify({
            "msg": "Role permissions updated",
            "role": role.name,
            "permissions": [p.name for p in role.permissions],
        })
