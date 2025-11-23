"""
ElevenLabs API integration service.
Handles downloading transcripts and audio recordings from ElevenLabs conversations.
"""
import os
import httpx
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class ElevenLabsService:
    """Service for interacting with ElevenLabs API."""

    def __init__(self):
        """Initialize ElevenLabs service with API key."""
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError(
                "ELEVENLABS_API_KEY environment variable is required")

        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def download_transcript(
        self,
        conversation_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Download transcript for a conversation.
        
        Uses the correct ElevenLabs API endpoint:
        GET /v1/convai/conversations/{conversation_id}

        Args:
            conversation_id: ElevenLabs conversation ID

        Returns:
            Dictionary with transcript data including messages and timestamps,
            or None if download fails
            
        Response structure:
        {
            "transcript": [
                {
                    "role": "user" | "agent",
                    "message": "text",
                    "time_in_call_secs": int,
                    ...
                }
            ],
            "metadata": {...},
            ...
        }
        """
        try:
            # Use correct endpoint: /v1/convai/conversations/{conversation_id}
            url = f"{self.base_url}/convai/conversations/{conversation_id}"

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

                conversation_data = response.json()
                
                # Extract transcript from response
                # The response contains transcript array and metadata
                transcript_data = {
                    "messages": conversation_data.get("transcript", []),
                    "metadata": conversation_data.get("metadata", {}),
                    "status": conversation_data.get("status"),
                    "has_audio": conversation_data.get("has_audio", False),
                    "has_user_audio": conversation_data.get("has_user_audio", False),
                    "has_response_audio": conversation_data.get("has_response_audio", False),
                }
                
                logger.info(
                    f"Successfully downloaded transcript for conversation_id={conversation_id}, "
                    f"messages_count={len(transcript_data['messages'])}"
                )
                return transcript_data

        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error downloading transcript for conversation_id={conversation_id}: {e}"
            )
            return None
        except Exception as e:
            logger.error(
                f"Error downloading transcript for conversation_id={conversation_id}: {e}",
                exc_info=True
            )
            return None

    async def download_audio(
        self,
        conversation_id: str,
        output_path: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Download audio recording for a conversation.
        
        Uses the correct ElevenLabs API endpoint:
        GET /v1/convai/conversations/{conversation_id}/audio

        Args:
            conversation_id: ElevenLabs conversation ID
            output_path: Optional path to save audio file locally

        Returns:
            Audio file bytes, or None if download fails
        """
        try:
            # Use correct endpoint: /v1/convai/conversations/{conversation_id}/audio
            url = f"{self.base_url}/convai/conversations/{conversation_id}/audio"

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

                audio_bytes = response.content

                # Save to file if output_path provided
                if output_path:
                    with open(output_path, "wb") as f:
                        f.write(audio_bytes)
                    logger.info(
                        f"Saved audio to {output_path} for conversation_id={conversation_id}"
                    )

                logger.info(
                    f"Successfully downloaded audio for conversation_id={conversation_id}, "
                    f"size={len(audio_bytes)} bytes"
                )
                return audio_bytes

        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error downloading audio for conversation_id={conversation_id}: {e}"
            )
            return None
        except Exception as e:
            logger.error(
                f"Error downloading audio for conversation_id={conversation_id}: {e}",
                exc_info=True
            )
            return None

    async def get_conversation_info(
        self,
        conversation_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get conversation metadata.

        Args:
            conversation_id: ElevenLabs conversation ID

        Returns:
            Dictionary with conversation information, or None if request fails
        """
        try:
            url = f"{self.base_url}/conversations/{conversation_id}"

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

                return response.json()

        except Exception as e:
            logger.error(
                f"Error getting conversation info for conversation_id={conversation_id}: {e}",
                exc_info=True
            )
            return None
