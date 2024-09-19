FROM ubuntu

# Update package list and install essential packages
RUN apt-get update && \
    apt-get install -y build-essential python3-pip net-tools iputils-ping iproute2 curl

# Install Node.js 16.x
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

# Install watchify globally via npm
RUN npm install -g watchify

# Expose necessary ports
EXPOSE 3000
EXPOSE 2000-2020
EXPOSE 10000-10100
