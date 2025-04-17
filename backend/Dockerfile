FROM denoland/deno:2.2.10

WORKDIR /app

# Add a name label for easy reference
LABEL name="jcs-backend"

# Copy the backend code into the container
COPY . /app

# Expose the application port
EXPOSE 8000

# Command to run the application
CMD ["run", "--allow-net", "--allow-read", "main.ts"]
