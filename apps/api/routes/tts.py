from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import logging
from services.tts_service import tts_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])


class TTSRequest(BaseModel):
    text: str
    cfg_value: Optional[float] = 2  # Higher for better quality
    inference_timesteps: Optional[int] = 10  # Higher for better voice quality
    normalize: Optional[bool] = True
    denoise: Optional[bool] = True
    retry_badcase: Optional[bool] = True
    retry_badcase_max_times: Optional[int] = 3  # More retries for quality
    # Lower threshold for better quality
    retry_badcase_ratio_threshold: Optional[float] = 6


@router.post("/generate")
async def generate_speech(request: TTSRequest):
    """
    Generate speech from text using VoxCPM
    """
    if not tts_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="TTS service is not available. Please check the model initialization."
        )

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    try:
        audio_bytes, mime_type = tts_service.generate_speech(
            text=request.text,
            cfg_value=request.cfg_value,
            inference_timesteps=request.inference_timesteps,
            normalize=request.normalize,
            denoise=request.denoise,
            retry_badcase=request.retry_badcase,
            retry_badcase_max_times=request.retry_badcase_max_times,
            retry_badcase_ratio_threshold=request.retry_badcase_ratio_threshold
        )

        return Response(
            content=audio_bytes,
            media_type=mime_type,
            headers={
                "Content-Disposition": "inline; filename=speech.wav",
                "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
            }
        )

    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate speech: {str(e)}"
        )
