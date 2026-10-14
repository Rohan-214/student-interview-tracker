
from main import SessionLocal, Teacher, pwd_context, settings

db = SessionLocal()

try:
    teacher = (
        db.query(Teacher)
        .filter_by(username=settings.admin_username)
        .first()
    )

    if teacher is None:
        print("Admin account not found.")
    else:
        teacher.password_hash = pwd_context.hash(
            settings.admin_password
        )
        db.commit()
        print("Admin password updated successfully.")

finally:
    db.close()
