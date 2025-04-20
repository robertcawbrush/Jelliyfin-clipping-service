FROM denoland/deno:2.2.10

WORKDIR /app

# Add a name label for easy reference
LABEL name="jcs-backend"

# Create necessary directories
RUN mkdir -p /app/data /app/src/db

# Copy package configuration first
COPY deno.json .
COPY deno.lock .

# Cache dependencies
RUN deno cache main.ts

# Copy the rest of the application
COPY . .

# Create volume mount point for the database
VOLUME /app/data

# Expose the application port
EXPOSE 8000

# Command to run the application
CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "main.ts"]
