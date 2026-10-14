from datetime import datetime, timedelta, timezone
from enum import Enum
import os

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine, String, Text, DateTime, ForeignKey, func, inspect
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker, Session

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/interview_tracker"
    secret_key: str = "development-only-change-this-secret"
    admin_username: str = "Admin"
    admin_password: str = "ChangeMe123!"
    frontend_origin: str = "http://localhost:5173"
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
database_url = settings.database_url

if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )

engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
TOKEN_MINUTES = 60 * 8
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class Base(DeclarativeBase): pass

class Teacher(Base):
    __tablename__ = "teachers"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))

class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    course: Mapped[str] = mapped_column(String(100), default="Data Analytics")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    participations: Mapped[list["Participant"]] = relationship(back_populates="student", cascade="all, delete-orphan")

class Interview(Base):
    __tablename__ = "interviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    company: Mapped[str] = mapped_column(String(160), index=True)
    role: Mapped[str] = mapped_column(String(140))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    mode: Mapped[str] = mapped_column(String(30), default="Online")
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    compensation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    participants: Mapped[list["Participant"]] = relationship(back_populates="interview", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "interview_participants"
    id: Mapped[int] = mapped_column(primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    attendance: Mapped[str] = mapped_column(String(20), default="Not marked")
    result: Mapped[str] = mapped_column(String(20), default="Pending")
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    compensation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    work_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    interview: Mapped[Interview] = relationship(back_populates="participants")
    student: Mapped[Student] = relationship(back_populates="participations")

class LoginOut(BaseModel): access_token: str; token_type: str = "bearer"; username: str
class StudentIn(BaseModel):
    name: str = Field(min_length=1, max_length=140)
    email: EmailStr | None = None
    phone: str | None = None
    course: str = "Data Analytics"
class StudentOut(StudentIn): model_config = ConfigDict(from_attributes=True); id: int
class InterviewIn(BaseModel):
    company: str = Field(min_length=1, max_length=160)
    role: str = Field(min_length=1, max_length=140)
    scheduled_at: datetime
    mode: str = "Online"
    location: str = Field(min_length=1, max_length=255)
    notes: str | None = None
    student_ids: list[int] = []
    @model_validator(mode="after")
    def location_must_not_be_blank(self):
        self.location = self.location.strip()
        if not self.location:
            raise ValueError("Interview location is required.")
        return self
class InterviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; company: str; role: str; scheduled_at: datetime; mode: str; location: str | None; compensation: str | None; notes: str | None
    model_config = ConfigDict(from_attributes=True)
class SelectedResultOut(BaseModel):
    id: int
    student_name: str
    company: str
    role: str
    work_location: str | None
    compensation: str | None
    scheduled_at: datetime
class ParticipantOut(BaseModel):
    id: int; interview_id: int; student_id: int; student_name: str; attendance: str; result: str; feedback: str | None; compensation: str | None; work_location: str | None
class ParticipantUpdate(BaseModel):
    attendance: str = Field(pattern="^(Not marked|Present|Absent)$")
    result: str = Field(pattern="^(Pending|Selected|Rejected)$")
    feedback: str | None = None
    compensation: str | None = Field(default=None, max_length=120)
    work_location: str | None = Field(default=None, max_length=255)
    @model_validator(mode="after")
    def rejection_needs_feedback(self):
        if self.attendance == "Absent":
            self.result = "Rejected"
            self.feedback = "Student did not attend the interview."
        if self.result == "Rejected" and not (self.feedback and self.feedback.strip()):
            raise ValueError("Feedback is required when a student is rejected.")
        return self

app = FastAPI(title="Training Center Interview Tracker", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def create_access_token(username: str):
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": username, "iat": now, "exp": now + timedelta(minutes=TOKEN_MINUTES)}, settings.secret_key, algorithm=ALGORITHM)

def current_teacher(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session", headers={"WWW-Authenticate": "Bearer"})
    try: username = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM]).get("sub")
    except JWTError: raise error
    teacher = db.query(Teacher).filter(Teacher.username == username).first()
    if not teacher: raise error
    return teacher

def participant_out(p: Participant):
    return ParticipantOut(
        id=p.id,
        interview_id=p.interview_id,
        student_id=p.student_id,
        student_name=p.student.name,
        attendance=p.attendance,
        result=p.result,
        feedback=p.feedback,
        compensation=p.compensation or p.interview.compensation,
        work_location=p.work_location,
    )

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    interview_columns = {
        column["name"] for column in inspect(engine).get_columns("interviews")
    }
    if "compensation" not in interview_columns:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "ALTER TABLE interviews ADD COLUMN compensation VARCHAR(120)"
            )
    participant_columns = {
        column["name"]
        for column in inspect(engine).get_columns("interview_participants")
    }
    if "compensation" not in participant_columns:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "ALTER TABLE interview_participants ADD COLUMN compensation VARCHAR(120)"
            )
    if "work_location" not in participant_columns:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "ALTER TABLE interview_participants ADD COLUMN work_location VARCHAR(255)"
            )

    db = SessionLocal()
    try:
        if not db.query(Teacher).filter_by(username=settings.admin_username).first():
            db.add(Teacher(username=settings.admin_username, password_hash=pwd_context.hash(settings.admin_password)))
            db.commit()
    finally: db.close()

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.post("/api/auth/login", response_model=LoginOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter_by(username=form.username).first()
    if not teacher or not pwd_context.verify(form.password, teacher.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return LoginOut(access_token=create_access_token(teacher.username), username=teacher.username)

@app.get("/api/dashboard", dependencies=[Depends(current_teacher)])
def dashboard(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    students = db.query(Student).count()
    interviews = db.query(Interview).count()
    selected = (
        db.query(func.count(func.distinct(Participant.student_id)))
        .filter(Participant.result == "Selected")
        .scalar()
    )
    rejected = db.query(Participant).filter_by(result="Rejected").count()
    pending = db.query(Participant).filter_by(result="Pending").count()
    upcoming = db.query(Interview).filter(Interview.scheduled_at >= now).order_by(Interview.scheduled_at).limit(5).all()
    return {"students": students, "interviews": interviews, "selected": selected, "rejected": rejected, "pending": pending, "upcoming": [InterviewOut.model_validate(i) for i in upcoming]}

@app.get("/api/students", response_model=list[StudentOut], dependencies=[Depends(current_teacher)])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).order_by(Student.name).all()

@app.post("/api/students", response_model=StudentOut, status_code=201, dependencies=[Depends(current_teacher)])
def add_student(payload: StudentIn, db: Session = Depends(get_db)):
    student = Student(**payload.model_dump())
    db.add(student); db.commit(); db.refresh(student); return student

@app.put("/api/students/{student_id}", response_model=StudentOut, dependencies=[Depends(current_teacher)])
def update_student(student_id: int, payload: StudentIn, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student: raise HTTPException(404, "Student not found")
    for key, value in payload.model_dump().items(): setattr(student, key, value)
    db.commit(); db.refresh(student); return student

@app.delete("/api/students/{student_id}", status_code=204, dependencies=[Depends(current_teacher)])
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student: raise HTTPException(404, "Student not found")
    db.delete(student); db.commit()

@app.get("/api/interviews", response_model=list[InterviewOut], dependencies=[Depends(current_teacher)])
def list_interviews(db: Session = Depends(get_db)):
    return db.query(Interview).order_by(Interview.scheduled_at).all()

@app.get("/api/results", dependencies=[Depends(current_teacher)])
def selected_results(db: Session = Depends(get_db)):
    rows = (
        db.query(Participant, Student, Interview)
        .join(Student, Participant.student_id == Student.id)
        .join(Interview, Participant.interview_id == Interview.id)
        .filter(Participant.result == "Selected")
        .order_by(Interview.scheduled_at.desc(), Student.name)
        .all()
    )
    return {
        "selected_count": len({participant.student_id for participant, _, _ in rows}),
        "selections": [
            SelectedResultOut(
                id=participant.id,
                student_name=student.name,
                company=interview.company,
                role=interview.role,
                work_location=participant.work_location or interview.location,
                compensation=participant.compensation or interview.compensation,
                scheduled_at=interview.scheduled_at,
            )
            for participant, student, interview in rows
        ],
    }

@app.post("/api/interviews", response_model=InterviewOut, status_code=201, dependencies=[Depends(current_teacher)])
def add_interview(payload: InterviewIn, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"student_ids"})
    interview = Interview(**data); db.add(interview); db.flush()
    for sid in set(payload.student_ids):
        if not db.get(Student, sid): raise HTTPException(400, f"Student {sid} does not exist")
        db.add(Participant(interview_id=interview.id, student_id=sid))
    db.commit(); db.refresh(interview); return interview

@app.put("/api/interviews/{interview_id}", response_model=InterviewOut, dependencies=[Depends(current_teacher)])
def update_interview(interview_id: int, payload: InterviewIn, db: Session = Depends(get_db)):
    interview = db.get(Interview, interview_id)
    if not interview: raise HTTPException(404, "Interview not found")

    for key, value in payload.model_dump(exclude={"student_ids"}).items():
        setattr(interview, key, value)

    existing_students = {p.student_id for p in interview.participants}
    desired_students = set(payload.student_ids)

    for sid in sorted(desired_students - existing_students):
        if not db.get(Student, sid): raise HTTPException(400, f"Student {sid} does not exist")
        db.add(Participant(interview_id=interview.id, student_id=sid))

    for sid in sorted(existing_students - desired_students):
        participant = db.query(Participant).filter_by(interview_id=interview_id, student_id=sid).first()
        if participant:
            db.delete(participant)

    db.commit(); db.refresh(interview); return interview

@app.delete("/api/interviews/{interview_id}", status_code=204, dependencies=[Depends(current_teacher)])
def delete_interview(interview_id: int, db: Session = Depends(get_db)):
    interview = db.get(Interview, interview_id)
    if not interview: raise HTTPException(404, "Interview not found")
    db.delete(interview); db.commit()

@app.get("/api/interviews/{interview_id}/participants", response_model=list[ParticipantOut], dependencies=[Depends(current_teacher)])
def list_participants(interview_id: int, db: Session = Depends(get_db)):
    if not db.get(Interview, interview_id): raise HTTPException(404, "Interview not found")
    rows = db.query(Participant).filter_by(interview_id=interview_id).join(Participant.student).order_by(Student.name).all()
    return [participant_out(p) for p in rows]

@app.put("/api/participants/{participant_id}", response_model=ParticipantOut, dependencies=[Depends(current_teacher)])
def update_participant(participant_id: int, payload: ParticipantUpdate, db: Session = Depends(get_db)):
    p = db.get(Participant, participant_id)
    if not p: raise HTTPException(404, "Interview participant not found")
    p.attendance = payload.attendance; p.result = payload.result
    p.feedback = payload.feedback.strip() if payload.feedback else None
    p.compensation = payload.compensation.strip() if payload.compensation else None
    p.work_location = payload.work_location.strip() if payload.work_location else None
    db.commit(); db.refresh(p); return participant_out(p)

@app.get("/api/students/{student_id}/history", dependencies=[Depends(current_teacher)])
def student_history(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student: raise HTTPException(404, "Student not found")
    rows = db.query(Participant).filter_by(student_id=student_id).join(Participant.interview).order_by(Interview.scheduled_at.desc()).all()
    return {"student": StudentOut.model_validate(student), "history": [{"id": p.id, "interview_id": p.interview.id, "company": p.interview.company, "role": p.interview.role, "scheduled_at": p.interview.scheduled_at, "attendance": p.attendance, "result": p.result, "feedback": p.feedback} for p in rows]}
