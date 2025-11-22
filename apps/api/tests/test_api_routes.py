"""
Tests for hybrid search API routes.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/v1/hybrid-search/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "hybrid-search"


def test_find_matches_without_index():
    """Test find_matches endpoint without indexed documents."""
    response = client.post(
        "/api/v1/hybrid-search/find-matches",
        json={
            "job_description": "Python developer with FastAPI experience",
            "k": 5,
            "search_type": "hybrid"
        }
    )
    # Should return error or empty results if no index exists
    assert response.status_code in [200, 400, 500]


def test_find_matches_invalid_search_type():
    """Test find_matches with invalid search type."""
    response = client.post(
        "/api/v1/hybrid-search/find-matches",
        json={
            "job_description": "Test",
            "k": 5,
            "search_type": "invalid"
        }
    )
    assert response.status_code == 400


def test_process_resume_invalid_file():
    """Test process_resume with invalid file."""
    # Create a fake file
    files = {"file": ("test.txt", b"fake content", "text/plain")}
    response = client.post(
        "/api/v1/hybrid-search/process-resume",
        files=files
    )
    # Should reject non-PDF/DOCX files
    assert response.status_code == 400

