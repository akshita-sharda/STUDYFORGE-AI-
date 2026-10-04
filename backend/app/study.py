"""Authenticated library, conversation and revision storage on the local server."""
import json
import sqlite3
from datetime import date
from typing import Literal
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator


def create_router(db_connection, current_user, upload_dir):
    router = APIRouter(prefix="/api/study")

    def owned(db, table, item_id, user):
        # table comes exclusively from the fixed route implementations below.
        row = db.execute(f"SELECT * FROM {table} WHERE id = ? AND user_id = ?", (item_id, user["id"])).fetchone()
        if not row:
            raise HTTPException(404, "Item not found.")
        return row

    @router.get("/library")
    def library(user=Depends(current_user)):
        with db_connection() as db:
            return {
                "subjects": [dict(r) for r in db.execute("SELECT id, name FROM subjects WHERE user_id = ? ORDER BY name", (user["id"],))],
                "documents": [dict(r) for r in db.execute("SELECT d.id, d.filename, ds.subject_id FROM documents d LEFT JOIN document_subjects ds ON d.id = ds.document_id WHERE d.user_id = ? ORDER BY d.created_at DESC", (user["id"],))],
            }

    @router.post("/subjects")
    def add_subject(request: Name, user=Depends(current_user)):
        with db_connection() as db:
            try:
                item_id = str(uuid4())
                db.execute("INSERT INTO subjects VALUES (?, ?, ?)", (item_id, user["id"], request.name))
            except sqlite3.IntegrityError:
                raise HTTPException(409, "That subject already exists.")
        return {"id": item_id, "name": request.name}

    @router.put("/documents/{document_id}/subject")
    def assign(document_id: str, request: Assignment, user=Depends(current_user)):
        with db_connection() as db:
            owned(db, "documents", document_id, user)
            if request.subject_id:
                owned(db, "subjects", request.subject_id, user)
                db.execute("INSERT OR REPLACE INTO document_subjects VALUES (?, ?)", (document_id, request.subject_id))
            else:
                db.execute("DELETE FROM document_subjects WHERE document_id = ?", (document_id,))
        return {"saved": True}

    @router.get("/documents/{document_id}/file")
    def download(document_id: str, user=Depends(current_user)):
        with db_connection() as db:
            row = owned(db, "documents", document_id, user)
        path = upload_dir / f"{row['id']}.pdf"
        if not path.is_file():
            raise HTTPException(404, "PDF file is unavailable.")
        return FileResponse(path, media_type="application/pdf", filename=row["filename"])

    @router.delete("/documents/{document_id}")
    def remove_document(document_id: str, user=Depends(current_user)):
        with db_connection() as db:
            row = owned(db, "documents", document_id, user)
            for table in ("chunks", "flashcards", "quizzes", "document_subjects"):
                db.execute(f"DELETE FROM {table} WHERE document_id=?", (document_id,))
            db.execute("UPDATE conversations SET document_id=NULL WHERE document_id=? AND user_id=?", (document_id, user["id"]))
            db.execute("DELETE FROM documents WHERE id=?", (document_id,))
            path = upload_dir / f"{row['id']}.pdf"
            if path.is_file():
                path.unlink()
        return {"deleted": True}

    @router.get("/summary")
    def summary(user=Depends(current_user)):
        with db_connection() as db:
            return {"tasks": [dict(r) for r in db.execute("SELECT id,title,kind,due_date,status FROM student_tasks WHERE user_id=? ORDER BY due_date IS NULL,due_date", (user["id"],))],
                    "conversations": [dict(r) for r in db.execute("SELECT id,title,updated_at FROM conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 3", (user["id"],))],
                    "documents": db.execute("SELECT count(*) FROM documents WHERE user_id=?", (user["id"],)).fetchone()[0],
                    "subjects": db.execute("SELECT count(*) FROM subjects WHERE user_id=?", (user["id"],)).fetchone()[0],
                    "topics": [dict(r) for r in db.execute("SELECT status,count(*) AS count FROM revision_topics WHERE user_id=? GROUP BY status", (user["id"],))]}

    @router.get("/conversations")
    def conversations(user=Depends(current_user)):
        with db_connection() as db:
            return [dict(r) for r in db.execute("SELECT id, title, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC, rowid DESC", (user["id"],))]

    @router.get("/conversations/{conversation_id}")
    def conversation(conversation_id: str, user=Depends(current_user)):
        with db_connection() as db:
            result = dict(owned(db, "conversations", conversation_id, user))
        result["messages"] = json.loads(result["messages"])
        return result

    @router.put("/conversations/{conversation_id}")
    def save_conversation(conversation_id: str, request: Conversation, user=Depends(current_user)):
        if len(conversation_id) > 80:
            raise HTTPException(422, "Invalid conversation ID.")
        with db_connection() as db:
            existing = db.execute("SELECT user_id FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
            if existing and existing["user_id"] != user["id"]:
                raise HTTPException(404, "Conversation not found.")
            if request.document_id:
                owned(db, "documents", request.document_id, user)
            db.execute("INSERT INTO conversations (id, user_id, title, document_id, study_mode, messages) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, document_id=excluded.document_id, study_mode=excluded.study_mode, messages=excluded.messages, updated_at=CURRENT_TIMESTAMP", (conversation_id, user["id"], request.title, request.document_id, request.study_mode, json.dumps([m.model_dump() for m in request.messages])))
        return {"saved": True}

    @router.delete("/conversations/{conversation_id}")
    def delete_conversation(conversation_id: str, user=Depends(current_user)):
        with db_connection() as db:
            owned(db, "conversations", conversation_id, user)
            db.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        return {"deleted": True}

    @router.get("/topics")
    def topics(user=Depends(current_user)):
        with db_connection() as db:
            return [dict(r) for r in db.execute("SELECT id, subject_id, name, status FROM revision_topics WHERE user_id = ? ORDER BY rowid DESC", (user["id"],))]

    @router.post("/topics")
    def add_topic(request: Topic, user=Depends(current_user)):
        with db_connection() as db:
            owned(db, "subjects", request.subject_id, user)
            item_id = str(uuid4())
            db.execute("INSERT INTO revision_topics VALUES (?, ?, ?, ?, ?)", (item_id, user["id"], request.subject_id, request.name, request.status))
        return {"id": item_id, **request.model_dump()}

    @router.patch("/topics/{topic_id}")
    def update_topic(topic_id: str, request: Status, user=Depends(current_user)):
        with db_connection() as db:
            owned(db, "revision_topics", topic_id, user)
            db.execute("UPDATE revision_topics SET status = ? WHERE id = ?", (request.status, topic_id))
        return {"saved": True}

    @router.delete("/topics/{topic_id}")
    def delete_topic(topic_id: str, user=Depends(current_user)):
        with db_connection() as db:
            owned(db, "revision_topics", topic_id, user)
            db.execute("DELETE FROM revision_topics WHERE id = ?", (topic_id,))
        return {"deleted": True}

    @router.get("/tasks")
    def tasks(user=Depends(current_user)):
        with db_connection() as db:
            return [dict(r) for r in db.execute("SELECT id, title, kind, due_date, status, subject, priority, notes FROM student_tasks WHERE user_id = ? ORDER BY status, due_date IS NULL, due_date, created_at DESC", (user["id"],))]

    @router.post("/tasks")
    def add_task(request: Task, user=Depends(current_user)):
        item_id = str(uuid4())
        with db_connection() as db:
            db.execute("INSERT INTO student_tasks (id, user_id, title, kind, due_date, status, subject, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (item_id, user["id"], request.title, request.kind, request.due_date.isoformat() if request.due_date else None, request.status, request.subject, request.priority, request.notes))
        return {"id": item_id, **request.model_dump(mode="json")}

    @router.put("/tasks/{task_id}")
    def update_task(task_id: str, request: Task, user=Depends(current_user)):
        with db_connection() as db:
            owned(db, "student_tasks", task_id, user)
            db.execute("UPDATE student_tasks SET title=?, kind=?, due_date=?, status=?, subject=?, priority=?, notes=? WHERE id=?", (request.title, request.kind, request.due_date.isoformat() if request.due_date else None, request.status, request.subject, request.priority, request.notes, task_id))
        return {"saved": True}

    @router.delete("/tasks/{task_id}")
    def delete_task(task_id: str, user=Depends(current_user)):
        with db_connection() as db:
            owned(db, "student_tasks", task_id, user)
            db.execute("DELETE FROM student_tasks WHERE id=?", (task_id,))
        return {"deleted": True}

    return router


class Name(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def trim(cls, value):
        if not value.strip():
            raise ValueError("Enter a name.")
        return value.strip()


class Task(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    kind: Literal["assignment", "revision", "exam", "question", "project"] = "assignment"
    subject: str = Field(default="", max_length=120)
    priority: Literal["low", "medium", "high"] = "medium"
    notes: str = Field(default="", max_length=2000)
    due_date: date | None = None
    status: Literal["pending", "done"] = "pending"

    @field_validator("title")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Enter a task title.")
        return value.strip()


class Assignment(BaseModel):
    subject_id: str | None = None


class Status(BaseModel):
    status: Literal["learning", "revision", "confident"] = "learning"


class Topic(Name, Status):
    subject_id: str


class SavedSource(BaseModel):
    page: int | None = None
    excerpt: str = Field(max_length=2000)


class SavedMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=50000)
    sources: list[SavedSource] = Field(default_factory=list, max_length=10)
    mode: str | None = None


class Conversation(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    document_id: str | None = None
    study_mode: Literal["explain", "hint", "debug", "viva", "solve", "plan"] = "explain"
    messages: list[SavedMessage] = Field(max_length=200)
