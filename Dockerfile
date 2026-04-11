# Use a lightweight nginx image to serve this static site
FROM nginx:stable-alpine

# Copy the static app into nginx document root
COPY . /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
