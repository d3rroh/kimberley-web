# Floating "stable" tag so rebuilds pick up nginx/Alpine security patches
FROM nginx:stable-alpine-slim

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Copy only the public site files; configs, backups and .git stay out of the image
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY index.html styles.css script.js robots.txt sitemap.xml manifest.webmanifest cv.pdf \
     favicon.svg favicon-16.png favicon-32.png favicon-64.png og-image.png og-banner.svg ./
COPY assets ./assets

EXPOSE 80
