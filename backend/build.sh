#!/usr/bin/env bash
# Build script for Render

echo "Building Django backend..."

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

echo "Build completed successfully!"