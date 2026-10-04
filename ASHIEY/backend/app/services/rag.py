from app.schemas import ChatRequest, ChatResponse
from app.services.gemini import generate_answer


def answer_question(request: ChatRequest) -> ChatResponse:
    """Single entry point for retrieve -> prompt -> generate -> cite."""
    context = "No indexed study material is available yet."
    answer = generate_answer(request.question, context)

    return ChatResponse(
        answer=answer,
        sources=[],
        grounded=False,
    )
