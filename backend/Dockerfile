# Production Dockerfile for Ardhnarishwar Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for cryptography and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY . ./

# Create persistent storage directories
RUN mkdir -p /storage/recordings /storage/resumes && chmod -R 777 /storage

ENV PYTHONUNBUFFERED=1
ENV RECORDING_STORAGE_ROOT=/storage/recordings
ENV RESUME_STORAGE_ROOT=/storage/resumes

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch production server with 4 workers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
