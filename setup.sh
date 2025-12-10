#!/bin/bash

echo "🚀 Setting up TrainPi..."

# Backend setup
echo "📦 Setting up backend..."
cd backend
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
pip install -r requirements.txt

if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials"
fi

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend
npm install

if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a PostgreSQL database named 'trainpi'"
echo "2. Update backend/.env with your database URL"
echo "3. Start backend: cd backend && python run.py"
echo "4. Start frontend: cd frontend && npm run dev"

