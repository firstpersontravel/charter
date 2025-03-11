##########################
##### Agency builder #####
##########################
FROM node:23-alpine AS agency-builder

# Install requirements for node-sass and app build tools
RUN apk add gcc && npm install -q -g webpack@4.44.1 webpack-cli@3.3.11

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install agency modules
COPY apps/agency/package.json apps/agency/package-lock.json /var/app/apps/agency/
RUN cd /var/app/apps/agency && npm -q install

# Install apps directory and static dir
COPY fptcore /var/app/fptcore
COPY apps/agency /var/app/apps/agency

# Build agency
RUN cd /var/app/apps/agency && NODE_ENV=production && NODE_OPTIONS=--openssl-legacy-provider webpack

##########################
##### Travel2 builder #####
##########################
FROM node:23-alpine AS travel2-builder

# Install requirements for node-sass and app build tools
RUN apk add gcc && npm install -q -g webpack@4.44.1 webpack-cli@3.3.11

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install travel2 modules
COPY apps/travel2/package.json apps/travel2/package-lock.json /var/app/apps/travel2/
RUN cd /var/app/apps/travel2 && npm -q install

# Install apps directory and static dir
COPY fptcore /var/app/fptcore
COPY apps/travel2 /var/app/apps/travel2

# Build travel2
RUN cd /var/app/apps/travel2 && NODE_ENV=production && NODE_OPTIONS=--openssl-legacy-provider webpack

######################
##### Main image #####
######################
FROM node:23-alpine
 
# Update OS, install tools, install requirements for node-gyp
RUN apk update && apk upgrade && apk add bash mysql mysql-client make python3 py3-setuptools g++

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install server node requirements. Force install fsevents@2.3.3 to fix node-gyp error
COPY headquarters/package.json headquarters/package-lock.json /var/app/headquarters/
RUN cd /var/app/headquarters && npm -q install --no-optional

# Install static directory, server and common code
COPY static /var/app/static
COPY fptcore /var/app/fptcore
COPY headquarters /var/app/headquarters

# Copy build applications
COPY --from=agency-builder /var/app/build /var/app/build
COPY --from=travel2-builder /var/app/build /var/app/build

# Set the default directory for our environment
WORKDIR /var/app

# Expose port 8000 for uwsgi or node
EXPOSE 8000
