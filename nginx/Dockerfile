#** nginx **dockerfile

# we are using the official nginx image from docker hub
FROM nginx:alpine

# we are copying the nginx.conf file to the nginx configuration folder
COPY nginx.conf /etc/nginx/nginx.conf

# are also exposing port 81
EXPOSE 80
EXPOSE 81

# we are using the STOPSIGNAL directive to stop the container gracefully
STOPSIGNAL SIGTERM
CMD ["nginx", "-g", "daemon off;"]