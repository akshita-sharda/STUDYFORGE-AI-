import json
from uuid import uuid4

import fitz
import pytest
from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def create_student(name: str) -> tuple[str, dict, dict[str, str]]:
    email = f"{uuid4()}@example.test"
    response = client.post(
        "/api/auth/signup",
        json={"name": name, "email": email, "password": "studyforge123"},
    )
    assert response.status_code == 200
    data = response.json()
    return data["user"]["id"], data, {"Authorization": f"Bearer {data['token']}"}


def remove_student(user_id: str) -> None:
    with main.db_connection() as db:
        document_ids = [
            row["id"]
            for row in db.execute("SELECT id FROM documents WHERE user_id = ?", (user_id,))
        ]
        for document_id in document_ids:
            db.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
            db.execute("DELETE FROM flashcards WHERE document_id = ?", (document_id,))
            db.execute("DELETE FROM quizzes WHERE document_id = ?", (document_id,))
            db.execute("DELETE FROM documents WHERE id = ?", (document_id,))
            (main.UPLOAD_DIR / f"{document_id}.pdf").unlink(missing_ok=True)
        db.execute("DELETE FROM quizzes WHERE user_id = ?", (user_id,))
        db.execute("DELETE FROM user_progress WHERE user_id = ?", (user_id,))
        db.execute("DELETE FROM users WHERE id = ?", (user_id,))


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["assistant"] == "ASHIEY"


def test_private_endpoints_require_login() -> None:
    assert client.get("/api/progress").status_code == 401
    assert client.get("/api/documents").status_code == 401
    assert client.post("/api/chat", json={"question": "Explain this"}).status_code == 401
    assert client.post("/api/flashcards/generate", json={"document_id": "fake"}).status_code == 401
    assert client.get("/api/flashcards/fake").status_code == 401
    assert client.post("/api/quizzes/generate", json={"document_id": "fake"}).status_code == 401
    assert client.post("/api/quizzes/fake/submit", json={"answers": {}}).status_code == 401
    assert client.get("/api/games/challenge/fake").status_code == 401
    assert client.post("/api/documents/from-url", json={"url": "https://example.org"}).status_code == 401


@pytest.mark.parametrize("url", ["file:///etc/passwd", "http://localhost/", "http://127.0.0.1/", "http://192.168.1.10/"])
def test_website_import_rejects_non_public_urls(url: str) -> None:
    with pytest.raises(main.HTTPException):
        main.validate_public_url(url)


def test_student_can_index_a_website_source(monkeypatch: pytest.MonkeyPatch) -> None:
    user_id, _, headers = create_student("Web Source Student")
    page_text = ("Photosynthesis converts sunlight, water, and carbon dioxide into glucose and oxygen. "
                 "Chlorophyll captures light energy in the chloroplast. The light-dependent reactions "
                 "produce ATP and NADPH, which power the Calvin cycle. " * 8)
    monkeypatch.setattr(main, "validate_public_url", lambda _url: "https://example.org/biology/photosynthesis")
    monkeypatch.setattr(main, "fetch_webpage", lambda _url: ("Photosynthesis guide", page_text, "https://example.org/biology/photosynthesis"))
    try:
        response = client.post("/api/documents/from-url", headers=headers, json={"url": "https://example.org/biology/photosynthesis"})
        assert response.status_code == 200
        source = response.json()
        assert source["filename"].startswith("Web: Photosynthesis guide")
        assert source["source_url"] == "https://example.org/biology/photosynthesis"
        assert source["chunks"] > 0
        assert client.get("/api/documents", headers=headers).json()[0]["source_url"] == source["source_url"]
        answer = client.post("/api/chat", headers=headers, json={"question": "What does photosynthesis produce?", "document_id": source["document_id"]})
        assert answer.status_code == 200
        assert answer.json()["grounded"] is True
        assert "glucose" in answer.json()["answer"]
    finally:
        remove_student(user_id)


def test_frontend_port_can_call_auth_api() -> None:
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://localhost:3001",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3001"


def test_student_can_signup_and_save_preferences() -> None:
    user_id, data, headers = create_student("Test Student")
    try:
        login = client.post(
            "/api/auth/login",
            json={"email": data["user"]["email"], "password": "studyforge123"},
        )
        assert login.status_code == 200
        preferences = client.put(
            "/api/profile/preferences",
            headers=headers,
            json={"name": "Updated Student", "subjects": ["Data Science"], "study_goal": "Pass my exam", "explanation_style": "example-based", "difficulty": "hard", "theme": "brown"},
        )
        assert preferences.status_code == 200
        saved_user = preferences.json()["user"]
        assert saved_user["name"] == "Updated Student"
        assert saved_user["subjects"] == ["Data Science"]
        assert saved_user["study_goal"] == "Pass my exam"
        assert saved_user["explanation_style"] == "example-based"
        assert saved_user["difficulty"] == "hard"
        assert saved_user["theme"] == "brown"
        for theme in ("light", "dark"):
            appearance = client.put(
                "/api/profile/preferences",
                headers=headers,
                json={"theme": theme},
            )
            assert appearance.status_code == 200
            assert appearance.json()["user"]["theme"] == theme
    finally:
        remove_student(user_id)


def test_upload_rejects_an_unreadable_pdf() -> None:
    user_id, _, headers = create_student("PDF Test Student")
    try:
        response = client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("broken.pdf", b"not a real PDF", "application/pdf")},
        )
        assert response.status_code == 400
        assert client.get("/api/documents", headers=headers).json() == []
    finally:
        remove_student(user_id)


def test_documents_quizzes_and_progress_are_private_per_student() -> None:
    owner_id, _, owner_headers = create_student("Document Owner")
    other_id, _, other_headers = create_student("Other Student")
    quiz_id = str(uuid4())
    quiz_questions = [{
        "id": "1",
        "question": "Which answer is correct?",
        "options": ["Correct", "Option B", "Option C", "Option D"],
        "answer": "Correct",
        "explanation": "This is the correct choice.",
    }]
    try:
        pdf = fitz.open()
        page = pdf.new_page()
        page.insert_text((72, 72), "Private biology notes explain cell respiration.")
        upload = client.post(
            "/api/documents/upload",
            headers=owner_headers,
            files={"file": ("private.pdf", pdf.tobytes(), "application/pdf")},
        )
        pdf.close()
        assert upload.status_code == 200
        document_id = upload.json()["document_id"]
        assert client.get("/api/documents", headers=owner_headers).json()[0]["id"] == document_id
        assert client.get("/api/documents", headers=other_headers).json() == []
        with main.db_connection() as db:
            db.execute("INSERT INTO quizzes (id, document_id, questions, user_id) VALUES (?, ?, ?, ?)", (quiz_id, document_id, json.dumps(quiz_questions), owner_id))

        chat = client.post("/api/chat", headers=other_headers, json={"question": "cell respiration"})
        assert chat.status_code == 200
        assert chat.json()["sources"] == []
        assert client.post("/api/chat", headers=other_headers, json={"question": "cell respiration", "document_id": document_id}).status_code == 404
        assert client.post("/api/flashcards/generate", headers=other_headers, json={"document_id": document_id}).status_code == 404
        assert client.get(f"/api/flashcards/{document_id}", headers=other_headers).status_code == 404
        assert client.get(f"/api/games/challenge/{document_id}", headers=other_headers).status_code == 404
        assert client.post(f"/api/quizzes/{quiz_id}/submit", headers=other_headers, json={"answers": {"1": "Correct"}}).status_code == 404

        submitted = client.post(
            f"/api/quizzes/{quiz_id}/submit",
            headers=owner_headers,
            json={"answers": {"1": "Correct"}},
        )
        assert submitted.status_code == 200
        assert submitted.json()["score"] == 1
        assert submitted.json()["progress"]["xp"] == 10
        assert client.post(f"/api/quizzes/{quiz_id}/submit", headers=owner_headers, json={"answers": {"1": "Correct"}}).status_code == 409
        assert client.get("/api/progress", headers=other_headers).json()["xp"] == 0
    finally:
        remove_student(owner_id)
        remove_student(other_id)
