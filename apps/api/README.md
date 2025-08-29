# HR Interview AI API

This is the Python API for the AI-powered HR interview application. It provides endpoints for generating interview questions based on job descriptions.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your Google API key:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   ```

   To get a Google API key for Gemini:
   - Go to https://ai.google.dev/
   - Sign in with your Google account
   - Navigate to the API Keys section
   - Create a new API key
   - Copy the key to your .env file

## Running the API

```bash
cd apps/api
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Endpoints

- `POST /api/v1/questions/generate`: Generate interview questions based on a job description
  - Request body: `{ "title": "Job Title", "description": "Job Description" }`
  - Response: `{ "questions": [{ "question": "...", "order": 1 }, ...] }`