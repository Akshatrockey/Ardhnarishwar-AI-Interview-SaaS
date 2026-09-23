"""
Ardhnarishwar SaaS - AI Global Co-pilot & Multi-Engine Endpoints
Prefix: /api/v1/ai
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..services.ai_orchestrator import ai_orchestrator

router = APIRouter(prefix="/api/v1/ai", tags=["AI Global Co-pilot & Multi-Engine"])

class ChatRequest(BaseModel):
    prompt: str
    mode: Optional[str] = "recruiter"
    model_id: Optional[str] = None
    stream: Optional[bool] = False
    history: Optional[List[Dict[str, str]]] = None
    company_name: Optional[str] = "Ardhnarishwar Enterprise"

@router.get("/models")
async def list_ai_models():
    """
    Returns available foundation models across Anthropic Claude, Google Gemini,
    Hugging Face / Open-source, and Local Enterprise Core.
    """
    return {
        "success": True,
        "models": ai_orchestrator.get_models(),
        "default_model": "claude-3-5-sonnet-20241022",
        "fallback_model": "ardhnarishwar-neural-enterprise-v4"
    }

@router.post("/copilot/chat")
async def copilot_chat_endpoint(req: ChatRequest):
    """
    Routes chat prompt through the Multi-Engine Orchestrator with automatic fallback cascade.
    Supports real-time streaming via SSE (stream=True) or JSON payload (stream=False).
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    if req.stream:
        return StreamingResponse(
            ai_orchestrator.stream_response(
                prompt=req.prompt,
                mode=req.mode or "recruiter",
                preferred_model_id=req.model_id,
                history=req.history,
                company_name=req.company_name or "Ardhnarishwar Enterprise"
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    result = await ai_orchestrator.generate_response(
        prompt=req.prompt,
        mode=req.mode or "recruiter",
        preferred_model_id=req.model_id,
        history=req.history,
        company_name=req.company_name or "Ardhnarishwar Enterprise"
    )

    return {
        "success": True,
        "data": result
    }

@router.get("/status")
async def copilot_status():
    """
    Returns AI runtime status, active engines, and operational parameters.
    """
    models = ai_orchestrator.get_models()
    online_count = sum(1 for m in models if m["status"] == "ONLINE")
    return {
        "status": "ONLINE",
        "total_engines": len(models),
        "online_engines": online_count,
        "fallback_guaranteed": True,
        "streaming_supported": True
    }
