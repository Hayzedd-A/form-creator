#!/bin/bash

echo "🚀 Setting up Form Creator..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual environment variables"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your MongoDB URI and other credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"