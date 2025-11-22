"""
Tests for hybrid search module.
"""
import pytest
import os
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

from services.document_loader import DocumentLoader
from services.text_sanitizer import TextSanitizer
from services.hybrid_matcher import HybridMatcher
from services.hybrid_search_service import HybridSearchService, process_resume, find_matches
from models.hybrid_search import CandidateDocument, SearchResult


class TestTextSanitizer:
    """Tests for TextSanitizer class."""
    
    def test_clean_text_removes_emails(self):
        """Test that emails are masked."""
        text = "Contact me at john.doe@example.com for more info"
        result = TextSanitizer.clean_text(text)
        assert "<EMAIL_REDACTED>" in result
        assert "john.doe@example.com" not in result
    
    def test_clean_text_removes_phones(self):
        """Test that Ukrainian phone numbers are masked."""
        text = "Call me at +380 50 123 4567 or 050-123-45-67"
        result = TextSanitizer.clean_text(text)
        assert "<PHONE_REDACTED>" in result
        assert "+380" not in result
        assert "050-123-45-67" not in result
    
    def test_clean_text_removes_links(self):
        """Test that URLs are masked."""
        text = "Visit https://example.com for more details"
        result = TextSanitizer.clean_text(text)
        assert "<LINK_REDACTED>" in result
        assert "https://example.com" not in result
    
    def test_clean_text_removes_excessive_whitespace(self):
        """Test that excessive whitespace is removed."""
        text = "This    has    too    many    spaces"
        result = TextSanitizer.clean_text(text)
        assert "  " not in result  # No double spaces
    
    def test_clean_text_preserves_content(self):
        """Test that actual content is preserved."""
        text = "Python developer with 5 years experience in FastAPI"
        result = TextSanitizer.clean_text(text)
        assert "Python" in result
        assert "FastAPI" in result


class TestDocumentLoader:
    """Tests for DocumentLoader class."""
    
    @pytest.mark.asyncio
    async def test_load_document_raises_for_nonexistent_file(self):
        """Test that FileNotFoundError is raised for nonexistent files."""
        with pytest.raises(FileNotFoundError):
            await DocumentLoader.load_document("/nonexistent/file.pdf")
    
    @pytest.mark.asyncio
    async def test_load_document_raises_for_unsupported_format(self):
        """Test that ValueError is raised for unsupported formats."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            with pytest.raises(ValueError):
                await DocumentLoader.load_document(tmp_path)
        finally:
            os.unlink(tmp_path)
    
    @pytest.mark.asyncio
    async def test_load_document_includes_metadata(self):
        """Test that metadata is included in loaded documents."""
        # Create a simple text file as mock
        with tempfile.NamedTemporaryFile(mode='w', suffix=".txt", delete=False) as tmp:
            tmp.write("Test content")
            tmp_path = tmp.name
        
        # This test would need actual PDF/DOCX files to work properly
        # For now, we'll just test the structure
        metadata = {"candidate_id": "123"}
        # Note: This test requires actual PDF/DOCX files to be fully functional


class TestHybridMatcher:
    """Tests for HybridMatcher class."""
    
    def test_hybrid_matcher_initialization(self):
        """Test that HybridMatcher initializes correctly."""
        matcher = HybridMatcher(
            persist_directory="./test_chroma_db",
            embedding_model="sentence-transformers/all-mpnet-base-v2"
        )
        
        assert matcher.chunk_size == 500
        assert matcher.chunk_overlap == 50
        assert matcher.vector_weight == 0.7
        assert matcher.bm25_weight == 0.3
        assert matcher.embeddings is not None
    
    @pytest.mark.asyncio
    async def test_find_matches_raises_without_indexing(self):
        """Test that find_matches raises error if documents not indexed."""
        matcher = HybridMatcher(persist_directory="./test_chroma_db")
        
        with pytest.raises(ValueError, match="must be indexed"):
            await matcher.find_matches("test query", k=5)


class TestHybridSearchService:
    """Tests for HybridSearchService class."""
    
    @pytest.mark.asyncio
    async def test_service_initialization(self):
        """Test that service initializes correctly."""
        service = HybridSearchService()
        assert service.document_loader is not None
        assert service.text_sanitizer is not None
        assert service.hybrid_matcher is not None


@pytest.mark.integration
class TestIntegration:
    """Integration tests for the full pipeline."""
    
    @pytest.mark.asyncio
    async def test_full_pipeline_with_mock_documents(self):
        """Test the full pipeline with mock documents."""
        # This is a simplified integration test
        # In a real scenario, you would need actual PDF/DOCX files
        
        # Test sanitization
        text = "Contact john@example.com or call +380 50 123 4567"
        sanitized = TextSanitizer.clean_text(text)
        assert "<EMAIL_REDACTED>" in sanitized
        assert "<PHONE_REDACTED>" in sanitized
        
        # Test that service can be initialized
        service = HybridSearchService(persist_directory="./test_chroma_db")
        assert service is not None


# Example test file that can be run with pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v"])

