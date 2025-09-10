# Simple production Dockerfile that serves pre-built assets
FROM nginx:alpine

# Copy the built application (run 'bun run build' first)
COPY dist /usr/share/nginx/html

# Create nginx configuration for SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
