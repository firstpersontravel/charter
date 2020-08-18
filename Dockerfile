##########################
##### Travel builder #####
##########################
FROM node:12-alpine as travel-builder
 
# Install essential tools
RUN apk add bash git curl wget

# Install travel build tools
RUN npm install -q -g ember-cli@2.16.0 bower

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install travel bower
COPY apps/travel/bower.json /var/app/apps/travel/
RUN cd /var/app/apps/travel && bower install -q --allow-root

# Install travel modules
COPY apps/travel/package.json apps/travel/package-lock.json /var/app/apps/travel/
RUN cd /var/app/apps/travel && npm -q install

# Install travel app
COPY fptcore /var/app/fptcore
COPY apps/travel /var/app/apps/travel

# Link core with symlink
RUN ln -nsf /var/app/fptcore /var/app/apps/travel/node_modules/fptcore

# Build travel app
RUN cd /var/app/apps/travel && ember build --env production

##########################
##### Agency builder #####
##########################
FROM node:12-alpine as agency-builder

# Install essential tools
RUN apk add bash git curl wget

# Install app build tools
RUN npm install -q -g webpack webpack-cli

# Install requirements for node-sass :{
RUN apk add --update python make gcc g++

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
 
# Update OS
RUN apk update
RUN apk upgrade
 
# Install essential tools
RUN apk add bash mysql mysql-client git curl wget

# Install server node requirements into separate folder so bcrypt can
# have native dependencies
COPY headquarters/package.json headquarters/package-lock.json /var/app/headquarters/
RUN cd /var/app/headquarters && npm -q install

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install apps directory and static dir
COPY static /var/app/static
COPY fptcore /var/app/fptcore
COPY apps /var/app/apps
COPY headquarters /var/app/headquarters

# Copy build applications
COPY --from=travel-builder /var/app/apps/travel/dist /var/app/apps/travel/dist
COPY --from=agency-builder /var/app/build /var/app/build

# Set the default directory for our environment
WORKDIR /var/app

# Expose port 8000 for uwsgi or node
EXPOSE 8000
