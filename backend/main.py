import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from config import *
from models import db, User, Permission, Role
from routes import register_routes

app = Flask(__name__)
app.config.from_object("config")
CORS(app)

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(app.root_path, "uploads", "profile_pictures")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.route("/uploads/profile_pictures/<filename>")
def serve_profile_picture(filename):
    return send_from_directory(UPLOAD_DIR, filename)

db.init_app(app)

with app.app_context():
    db.create_all()

    # Migration: add is_active column if missing (existing databases)
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        columns = [c["name"] for c in inspector.get_columns("user")]
        if "is_active" not in columns:
            db.engine.execute("ALTER TABLE user ADD COLUMN is_active BOOLEAN DEFAULT 1")
    except Exception:
        pass  # Table may not exist yet, ignore

    # Migration: add profile_picture column if missing (existing databases)
    try:
        from sqlalchemy import text
        inspector = inspect(db.engine)
        columns = [c["name"] for c in inspector.get_columns("user")]
        if "profile_picture" not in columns:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE user ADD COLUMN profile_picture VARCHAR(255)"))
                conn.commit()
            print("[migrate] Added profile_picture column")
    except Exception as e:
        print(f"[migrate] profile_picture skipped: {e}")

    # Migration: add last_login column if missing (existing databases)
    try:
        inspector = inspect(db.engine)
        columns = [c["name"] for c in inspector.get_columns("user")]
        if "last_login" not in columns:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE user ADD COLUMN last_login DATETIME"))
                conn.commit()
            print("[migrate] Added last_login column")
    except Exception as e:
        print(f"[migrate] last_login skipped: {e}")

    # Migration: user_permissions -> role_permissions (existing databases from old schema)
    try:
        inspector = inspect(db.engine)
        if "user_permissions" in inspector.get_table_names():
            rows = db.engine.execute(
                "SELECT user_id, permission_id FROM user_permissions"
            ).fetchall()
            if rows:
                role_perms = {}
                for user_id, perm_id in rows:
                    u = User.query.get(user_id)
                    if u and u.role:
                        rid = u.role.id
                        if rid not in role_perms:
                            role_perms[rid] = set()
                        role_perms[rid].add(perm_id)
                for role_id, perm_ids in role_perms.items():
                    role = Role.query.get(role_id)
                    if role:
                        existing = {p.id for p in role.permissions}
                        for pid in perm_ids:
                            if pid not in existing:
                                perm = Permission.query.get(pid)
                                if perm:
                                    role.permissions.append(perm)
                db.session.commit()
    except Exception:
        pass  # No old table or migration irrelevant

    # ──────────────────────────────────────────
    # Seed permissions
    #   Replaced "Assign Permission" with:
    #     "Manage Users"  → can edit users, change their role, toggle status
    #     "Manage Roles"  → can manage role permissions
    # ──────────────────────────────────────────
    default_perms = [
        "View Users",
        "Create Users",
        "Delete Users",
        "Manage Users",
        "Manage Roles",
    ]

    for p in default_perms:
        if not Permission.query.filter_by(name=p).first():
            db.session.add(Permission(name=p))
    db.session.commit()

    # ──────────────────────────────────────────
    # Seed roles
    # ──────────────────────────────────────────
    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin")
        db.session.add(admin_role)

    user_role = Role.query.filter_by(name="user").first()
    if not user_role:
        user_role = Role(name="user")
        db.session.add(user_role)
    db.session.commit()

    # Re-query so references are fresh
    admin_role = Role.query.filter_by(name="admin").first()
    user_role = Role.query.filter_by(name="user").first()

    # ──────────────────────────────────────────
    # Seed / migrate admin user
    # ──────────────────────────────────────────
    admin = User.query.filter_by(email="hamid59@gmail.com").first()
    if not admin:
        admin = User(
            first_name="Hamid",
            last_name="Maqsood",
            email="hamid59@gmail.com",
            phone="03001234567",
            password=generate_password_hash("admin@123"),
            role_id=admin_role.id if admin_role else None,
        )
        db.session.add(admin)
        db.session.commit()
    else:
        # Existing admin user – ensure they have the admin role
        # (unless they have been upgraded to super_admin)
        if admin_role and (not admin.role_id or admin.role_id != admin_role.id):
            sa_role = Role.query.filter_by(name="super_admin").first()
            if not sa_role or admin.role_id != sa_role.id:
                admin.role_id = admin_role.id
                db.session.commit()

    # ──────────────────────────────────────────
    # Assign all current permissions to admin role
    # ──────────────────────────────────────────
    if admin_role:
        admin_role.permissions = Permission.query.all()
        db.session.commit()

    # ──────────────────────────────────────────
    # Seed super_admin role
    # ──────────────────────────────────────────
    super_admin_role = Role.query.filter_by(name="super_admin").first()
    if not super_admin_role:
        super_admin_role = Role(name="super_admin")
        db.session.add(super_admin_role)
        db.session.commit()

    # Ensure super_admin role has all permissions (for JWT/frontend compatibility)
    if super_admin_role:
        super_admin_role.permissions = Permission.query.all()
        db.session.commit()

    # ──────────────────────────────────────────
    # Seed default Super Admin user
    # ──────────────────────────────────────────
    super_admin_user = User.query.filter_by(email="hamid59@gmail.com").first()
    if not super_admin_user:
        super_admin_user = User(
            first_name="Hamid",
            last_name="Maqsood",
            email="hamid59@gmail.com",
            phone="03001234567",
            password=generate_password_hash("admin@123"),
            role_id=super_admin_role.id if super_admin_role else None,
            is_active=True,
        )
        db.session.add(super_admin_user)
        db.session.commit()
    else:
        # User exists — ensure they have the super_admin role
        if super_admin_role and (
            not super_admin_user.role_id or super_admin_user.role_id != super_admin_role.id
        ):
            super_admin_user.role_id = super_admin_role.id
            db.session.commit()

    # ──────────────────────────────────────────
    # Migration: assign any user without a role to the default "user" role
    # ──────────────────────────────────────────
    if user_role:
        unassigned_users = User.query.filter(User.role_id.is_(None)).all()
        for u in unassigned_users:
            u.role_id = user_role.id
        if unassigned_users:
            db.session.commit()

register_routes(app)

if __name__ == "__main__":
    app.run(debug=True)
