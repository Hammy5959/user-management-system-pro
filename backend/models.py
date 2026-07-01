from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

role_permissions = db.Table(
    "role_permissions",
    db.Column("role_id", db.Integer, db.ForeignKey("role.id")),
    db.Column("permission_id", db.Integer, db.ForeignKey("permission.id")),
)


class Permission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)

    roles = db.relationship("Role", secondary=role_permissions, back_populates="permissions")


class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)

    permissions = db.relationship("Permission", secondary=role_permissions, back_populates="roles")


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)

    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)

    password = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    profile_picture = db.Column(db.String(255), nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey("role.id"))
    role = db.relationship("Role", backref="users")
