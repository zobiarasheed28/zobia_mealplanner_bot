# Use an official Python image from Docker Hub
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any required packages listed in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose a port if needed (e.g., Flask app runs on 5000)
# EXPOSE 5000

# Command to run the Python script (replace with your main file)
CMD ["python", "app.py"]