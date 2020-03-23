FROM node:12-alpine
 
# Update OS
RUN apk update
RUN apk upgrade
 
# Install essential tools
RUN apk add bash mysql mysql-client git curl wget

# Install and setup nginx
RUN apk update
RUN apk add nginx
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log
COPY docker/web/nginx.conf /etc/nginx/nginx.conf
ADD docker/web/conf /etc/nginx/conf.d

# Install app build tools
RUN npm install -q -g ember-cli@2.16.0 webpack webpack-cli bower

# Install requirements for node-sass :{
RUN apk add --update python make gcc g++

# Install server node requirements
COPY headquarters/package.json headquarters/package-lock.json /var/app/headquarters/
RUN cd /var/app/headquarters && npm -q install

# Install core modules
COPY fptcore/package.json fptcore/package-lock.json /var/app/fptcore/
RUN cd /var/app/fptcore && npm -q install

# Install travel bower
COPY apps/travel/bower.json /var/app/apps/travel/
RUN cd /var/app/apps/travel && bower install -q --allow-root

# Install travel modules
COPY apps/travel/package.json apps/travel/package-lock.json /var/app/apps/travel/
RUN cd /var/app/apps/travel && npm -q install

# Install agency modules
COPY apps/agency/package.json apps/agency/package-lock.json /var/app/apps/agency/
RUN cd /var/app/apps/agency && npm -q install

# Install apps directory and static dir
COPY static /var/app/static
COPY fptcore /var/app/fptcore
COPY apps /var/app/apps
COPY headquarters /var/app/headquarters

# Link core with symlink
RUN ln -nsf /var/app/fptcore /var/app/apps/travel/node_modules/fptcore

# Build applications
RUN cd /var/app/apps/travel && ember build --env production
RUN cd /var/app/apps/agency && NODE_ENV=production webpack

# Set the default directory for our environment
WORKDIR /var/app

# Expose port 8000 for uwsgi or node
EXPOSE 8000
