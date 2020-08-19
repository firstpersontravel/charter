##########################
##### Travel builder #####
##########################
FROM node:12-alpine as travel-builder
 
# Git is needed for bower; install travel build tools
RUN apk add git && npm install -q -g ember-cli@2.16.0 bower

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install travel bower
COPY apps/travel/bower.json /var/app/apps/travel/
RUN cd /var/app/apps/travel && bower install -q --allow-root

# Install travel modules
COPY apps/travel/package.json apps/travel/package-lock.json /var/app/apps/travel/
RUN cd /var/app/apps/travel && npm -q install

# Install core and travel app
COPY fptcore /var/app/fptcore
COPY apps/travel /var/app/apps/travel

# Link core with symlink and build travel app
RUN ln -nsf /var/app/fptcore /var/app/apps/travel/node_modules/fptcore && \
    cd /var/app/apps/travel && ember build --env production

##########################
##### Agency builder #####
##########################
FROM node:12-alpine as agency-builder

# Install requirements for node-sass and app build tools
RUN apk add gcc && npm install -q -g webpack webpack-cli

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
RUN cd /var/app/apps/agency && NODE_ENV=production webpack

######################
##### Main image #####
######################
FROM node:12-alpine
 
# Update OS, install tools, install requirements for node-gyp
RUN apk update && apk upgrade && apk add bash mysql mysql-client make python g++

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install server node requirements
COPY headquarters/package.json headquarters/package-lock.json /var/app/headquarters/
RUN cd /var/app/headquarters && npm -q install

# Install static directory, server and common code
COPY static /var/app/static
COPY fptcore /var/app/fptcore
COPY headquarters /var/app/headquarters

# Copy build applications
COPY --from=travel-builder /var/app/apps/travel/dist /var/app/apps/travel/dist
COPY --from=agency-builder /var/app/build /var/app/build

# Set the default directory for our environment
WORKDIR /var/app

# Expose port 8000 for uwsgi or node
EXPOSE 8000
