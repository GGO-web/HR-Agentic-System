#!/usr/bin/env python3
"""
VoxCPM Model Cache Management Script

This script helps manage the VoxCPM model cache and can be used to:
1. Clear the existing cache
2. Re-download the model
3. Check model status
"""

import os
import sys
import shutil
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def clear_huggingface_cache():
    """Clear the entire Hugging Face cache"""
    cache_dir = Path.home() / ".cache" / "huggingface"

    if cache_dir.exists():
        logger.info(f"Clearing Hugging Face cache at: {cache_dir}")
        try:
            shutil.rmtree(cache_dir)
            logger.info("Cache cleared successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return False
    else:
        logger.info("No cache directory found")
        return True


def check_model_files():
    """Check if VoxCPM model files exist"""
    model_path = Path.home() / ".cache" / "huggingface" / \
        "models--openbmb--VoxCPM-0.5B"
    required_files = ["audiovae.pth", "config.json", "pytorch_model.bin"]

    if not model_path.exists():
        logger.info("Model directory does not exist")
        return False

    missing_files = [file for file in required_files if not (
        model_path / file).exists()]

    if missing_files:
        logger.warning(f"Missing model files: {missing_files}")
        return False
    else:
        logger.info("All required model files are present")
        return True


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python manage_voxcpm_cache.py [clear|check|help]")
        print("  clear  - Clear the cache and force re-download")
        print("  check  - Check if model files are present")
        print("  help   - Show this help message")
        return

    command = sys.argv[1].lower()

    if command == "clear":
        logger.info("Starting cache clearing process...")
        if clear_huggingface_cache():
            logger.info(
                "Cache cleared. Please restart your API server to re-download the model.")
        else:
            logger.error("Failed to clear cache")
            sys.exit(1)

    elif command == "check":
        logger.info("Checking model files...")
        if check_model_files():
            logger.info("Model files are ready")
        else:
            logger.warning("Model files are missing or incomplete")
            logger.info(
                "Run 'python manage_voxcpm_cache.py clear' to fix this")

    elif command == "help":
        print("VoxCPM Model Cache Management Script")
        print("====================================")
        print()
        print("This script helps manage the VoxCPM model cache.")
        print()
        print("Commands:")
        print("  clear  - Clear the entire Hugging Face cache")
        print("  check  - Check if all required model files are present")
        print("  help   - Show this help message")
        print()
        print("Typical workflow:")
        print("1. If you get 'No such file or directory' errors, run: python manage_voxcpm_cache.py clear")
        print("2. Restart your API server")
        print("3. The model will be automatically downloaded on first use")

    else:
        logger.error(f"Unknown command: {command}")
        print("Use 'python manage_voxcpm_cache.py help' for usage information")


if __name__ == "__main__":
    main()
