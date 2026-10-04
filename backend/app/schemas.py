from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_id: str | None = None


class Source(BaseModel):
    document_id: str
    page: int | None = None
    excerpt: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = []
    grounded: bool
