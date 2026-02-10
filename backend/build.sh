#!/usr/bin/env bash
# Build script for Render

set -o errexit  # Exit on error

echo "Building Django backend..."

# Upgrade pip to latest version
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Verify gunicorn installation
echo "Verifying gunicorn installation..."
pip show gunicorn || echo "Warning: gunicorn not found!"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser automatically if not exists
echo "Creating superuser (if not exists)..."
python manage.py create_superuser_auto

# Make sure admin@fitnutrition.com is superuser with staff privileges
echo "Ensuring admin user has staff privileges..."
python manage.py make_user_superuser admin@fitnutrition.com || echo "Admin user setup will be handled by create_superuser_auto"

echo "Build completed successfully!"
