# Use Nginx to serve static files
FROM nginx:alpine

# Copy built app
COPY build /usr/share/nginx/html

# Add custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf
