#!/bin/bash

# Start all services for the HR Agentic System
echo "Starting all services for HR Agentic System..."

# Create Python virtual environment if it doesn't exist
if [ ! -d "apps/api/venv" ]; then
    echo "Creating Python virtual environment..."
    cd apps/api
    python -m venv venv
    source ./venv/Scripts/activate
    pip install -r requirements.txt
    cd ../../
else
    echo "Python virtual environment already exists"
fi

# Run all services using Turborepo
pnpm run dev:all
