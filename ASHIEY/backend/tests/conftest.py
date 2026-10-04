import pytest

@pytest.fixture(autouse=True)
def isolate_groq_credentials(monkeypatch):
    # Unit tests must never use a developer's real provider key.
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
