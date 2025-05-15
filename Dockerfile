# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files to the container
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code, including the pre-built files
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "build"]