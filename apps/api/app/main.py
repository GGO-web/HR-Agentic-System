from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.questions import router as questions_router
from routes.tts import router as tts_router

app = FastAPI(
    title="HR Interview AI API",
    description="API for AI-powered HR interview question generation",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(questions_router, prefix="/api/v1")
app.include_router(tts_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "HR Interview AI API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
