# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and other packages
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY gateway_py.py .
COPY ../models ./models
COPY ../hub ./hub
COPY ../examples/webapp ./examples/webapp

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "gateway_py:app", "--host", "0.0.0.0", "--port", "8080"]
