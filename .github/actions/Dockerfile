# .github/actions/update_posts/Dockerfile

FROM python:3.10-slim

COPY ./app /app
# Set working directory
WORKDIR /app

# Install git (needed for pushing)
RUN apt-get update && apt-get install -y git

# Entry point to execute the Python script
ENTRYPOINT ["python", "generate_posts.py"]
