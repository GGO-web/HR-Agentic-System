import os
import tempfile
import logging
from typing import Optional, Tuple
from pathlib import Path

# Handle distutils compatibility for Python 3.12+
try:
    import distutils
except ImportError:
    # distutils was removed in Python 3.12, but some packages still need it
    import setuptools as distutils

import soundfile as sf
import numpy as np
from voxcpm import VoxCPM
from huggingface_hub import snapshot_download

logger = logging.getLogger(__name__)


class TTSService:
    def __init__(self):
        self.model = None
        self.model_path = None
        self.cache_dir = Path.home() / ".cache" / "huggingface"
        self._initialize_model()

    def _initialize_model(self):
        """Initialize the VoxCPM model"""
        try:
            # Download model if not exists
            model_id = "openbmb/VoxCPM-0.5B"
            self.model_path = self.cache_dir / "models--openbmb--VoxCPM-0.5B"

            # Ensure cache directory exists
            self.cache_dir.mkdir(parents=True, exist_ok=True)

            # Check if model files exist, if not download them
            required_files = ["audiovae.pth",
                              "config.json", "pytorch_model.bin"]
            model_files_exist = all(
                (self.model_path / file).exists() for file in required_files
            )

            if not model_files_exist:
                logger.info(f"Downloading VoxCPM model: {model_id}")
                logger.info(
                    "This may take a few minutes for the first time...")

                # Clear any existing incomplete downloads
                if self.model_path.exists():
                    import shutil
                    shutil.rmtree(self.model_path)

                # Force download the model with retry mechanism
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        logger.info(
                            f"Download attempt {attempt + 1}/{max_retries}")
                        snapshot_download(
                            repo_id=model_id,
                            local_dir=self.model_path,
                            cache_dir=self.cache_dir,
                            local_files_only=False,
                            force_download=True,
                            resume_download=True
                        )
                        logger.info("Model download completed successfully")
                        break
                    except Exception as e:
                        logger.warning(
                            f"Download attempt {attempt + 1} failed: {e}")
                        if attempt < max_retries - 1:
                            logger.info("Retrying download...")
                            # Clear partial download
                            if self.model_path.exists():
                                shutil.rmtree(self.model_path)
                        else:
                            logger.error("All download attempts failed")
                            raise e

            # Verify all required files are present
            missing_files = [
                file for file in required_files
                if not (self.model_path / file).exists()
            ]

            if missing_files:
                logger.error(f"Missing model files: {missing_files}")
                logger.error(
                    "Please check your internet connection and try again")
                self.model = None
                return

            # Verify file integrity
            corrupted_files = self._verify_file_integrity()
            if corrupted_files:
                logger.error(
                    f"Corrupted model files detected: {corrupted_files}")
                logger.error("Clearing cache and retrying download...")
                if self.model_path.exists():
                    import shutil
                    shutil.rmtree(self.model_path)
                # Retry the download process
                return self._initialize_model()

            # Load the model
            logger.info("Loading VoxCPM model...")
            self.model = VoxCPM.from_pretrained(str(self.model_path))
            logger.info("VoxCPM model loaded successfully")

        except ImportError as e:
            logger.error(f"VoxCPM dependencies not installed: {e}")
            logger.error(
                "Please install required packages: pip install voxcpm soundfile numpy")
            self.model = None
        except Exception as e:
            logger.error(f"Failed to initialize VoxCPM model: {e}")
            logger.error("TTS service will fall back to browser TTS")
            logger.error("You can try:")
            logger.error("1. Check your internet connection")
            logger.error("2. Clear the cache: rm -rf ~/.cache/huggingface")
            logger.error("3. Restart the API server")
            self.model = None

    def generate_speech(
        self,
        text: str,
        prompt_wav_path: Optional[str] = None,
        prompt_text: Optional[str] = None,
        cfg_value: float = 2.0,
        inference_timesteps: int = 10,
        normalize: bool = True,
        denoise: bool = True,
        retry_badcase: bool = True,
        retry_badcase_max_times: int = 3,
        retry_badcase_ratio_threshold: float = 6.0
    ) -> Tuple[bytes, str]:
        """
        Generate speech from text using VoxCPM

        Args:
            text: Text to convert to speech
            prompt_wav_path: Optional path to reference audio for voice cloning
            prompt_text: Optional reference text for voice cloning
            cfg_value: LM guidance value (higher = better adherence to prompt)
            inference_timesteps: Number of inference timesteps (higher = better quality)
            normalize: Enable text normalization
            denoise: Enable denoising
            retry_badcase: Enable retry for bad cases
            retry_badcase_max_times: Maximum retry attempts
            retry_badcase_ratio_threshold: Length threshold for bad case detection

        Returns:
            Tuple of (audio_bytes, mime_type)
        """
        if not self.model:
            raise RuntimeError("VoxCPM model not initialized")

        try:
            # Generate audio
            logger.info(f"Generating speech for text: {text[:50]}...")
            wav = self.model.generate(
                text=text,
                prompt_wav_path=prompt_wav_path,
                prompt_text=prompt_text,
                cfg_value=cfg_value,
                inference_timesteps=inference_timesteps,
                normalize=normalize,
                denoise=denoise,
                retry_badcase=retry_badcase,
                retry_badcase_max_times=retry_badcase_max_times,
                retry_badcase_ratio_threshold=retry_badcase_ratio_threshold
            )

            # Convert to bytes
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                sf.write(temp_file.name, wav, 16000)

                with open(temp_file.name, "rb") as f:
                    audio_bytes = f.read()

                # Clean up temp file
                os.unlink(temp_file.name)

            logger.info("Speech generation completed successfully")
            return audio_bytes, "audio/wav"

        except Exception as e:
            logger.error(f"Failed to generate speech: {e}")
            raise RuntimeError(f"Speech generation failed: {e}")

    def _verify_file_integrity(self):
        """Verify the integrity of downloaded model files"""
        corrupted_files = []

        try:
            # Check if pytorch_model.bin can be loaded
            pytorch_model_path = self.model_path / "pytorch_model.bin"
            if pytorch_model_path.exists():
                try:
                    import torch
                    torch.load(pytorch_model_path, map_location='cpu')
                except Exception as e:
                    logger.warning(f"pytorch_model.bin appears corrupted: {e}")
                    corrupted_files.append("pytorch_model.bin")

            # Check if audiovae.pth can be loaded
            audiovae_path = self.model_path / "audiovae.pth"
            if audiovae_path.exists():
                try:
                    import torch
                    torch.load(audiovae_path, map_location='cpu')
                except Exception as e:
                    logger.warning(f"audiovae.pth appears corrupted: {e}")
                    corrupted_files.append("audiovae.pth")

            # Check config.json
            config_path = self.model_path / "config.json"
            if config_path.exists():
                try:
                    import json
                    with open(config_path, 'r') as f:
                        json.load(f)
                except Exception as e:
                    logger.warning(f"config.json appears corrupted: {e}")
                    corrupted_files.append("config.json")

        except Exception as e:
            logger.error(f"Error during file integrity check: {e}")

        return corrupted_files

    def is_available(self) -> bool:
        """Check if TTS service is available"""
        return self.model is not None


# Global TTS service instance
tts_service = TTSService()
