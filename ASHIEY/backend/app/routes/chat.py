from fastapi import APIRouter

from app.schemas import ChatRequest, ChatResponse
from app.services.rag import answer_question

router = APIRouter()


@router.post("", response_model=ChatResponse)
def ask_ashiey(request: ChatRequest) -> ChatResponse:
    return answer_question(request)
