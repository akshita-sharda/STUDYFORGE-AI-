from app.config import settings


def generate_answer(question: str, context: str) -> str:
    """Gemini integration boundary; replace the temporary response in the next step."""
    if not settings.gemini_api_key:
        return (
            "I’m ready to help you study, but Gemini is not configured yet. "
            "Add GEMINI_API_KEY to the backend environment."
        )

    # The real Gemini client will be added after the RAG retrieval pipeline is tested.
    return f"ASHIEY received your question: {question}\n\nStudy context:\n{context}"
