echo "Preparing API..."

python -m venv venv
source ./venv/Scripts/activate
pip install -r requirements.txt

echo "API prepared successfully"

#!/bin/bash
uvicorn app.main:app --reload --port 8000