FROM alpine

# development, staging, or production
ARG stage=development
 
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

# Install yarn
RUN echo -e 'http://dl-cdn.alpinelinux.org/alpine/edge/main\nhttp://dl-cdn.alpinelinux.org/alpine/edge/community\nhttp://dl-cdn.alpinelinux.org/alpine/edge/testing' > /etc/apk/repositories

# Install node
RUN apk add nodejs=8.11.3-r3

RUN apk add --no-cache yarn

# Install app build tools
RUN yarn global add ember-cli bower webpack@2.2.0-rc.2

# Install requirements for node-sass :{
RUN apk add --update python make gcc g++

# Install beta server node requirements
RUN mkdir -p /var/npm/beta
ADD headquarters/package.json /var/npm/beta/package.json
ADD headquarters/yarn.lock /var/npm/beta/yarn.lock
RUN cd /var/npm/beta && yarn install

# Install core modules
RUN mkdir -p /var/npm/fptcore
ADD apps/fptcore/package.json /var/npm/fptcore/package.json
ADD apps/fptcore/yarn.lock /var/npm/fptcore/yarn.lock
RUN cd /var/npm/fptcore && yarn install

# Install travel modules
RUN mkdir -p /var/npm/travel
ADD apps/travel/package.json /var/npm/travel/package.json
ADD apps/travel/yarn.lock /var/npm/travel/yarn.lock
RUN cd /var/npm/travel && yarn install

# Install agency modules
RUN mkdir -p /var/npm/agency
ADD apps/agency/package.json /var/npm/agency/package.json
ADD apps/agency/yarn.lock /var/npm/agency/yarn.lock
RUN cd /var/npm/agency && yarn install

# Install travel bower components
RUN mkdir -p /var/bower/travel
ADD apps/travel/bower.json /var/bower/travel/bower.json
RUN cd /var/bower/travel && bower --allow-root install

# Install apps directory and static dir
ADD static /var/app/static
ADD apps /var/app/apps

# Symlink cached requirements
RUN ln -nsf /var/npm/fptcore/node_modules /var/app/apps/fptcore
RUN ln -nsf /var/npm/agency/node_modules /var/app/apps/agency
RUN ln -nsf /var/npm/travel/node_modules /var/app/apps/travel
RUN ln -nsf /var/bower/travel/bower_components /var/app/apps/travel

# Link core with symlink
RUN rm -rf /var/app/apps/agency/node_modules/fptcore && \
    ln -nsf /var/app/apps/fptcore /var/app/apps/agency/node_modules/fptcore
RUN rm -rf /var/app/apps/travel/node_modules/fptcore && \
    ln -nsf /var/app/apps/fptcore /var/app/apps/travel/node_modules/fptcore
RUN ln -nsf /var/app/apps/fptcore /var/npm/beta/node_modules

# Run tests
RUN cd /var/app/apps/fptcore && yarn test
RUN cd /var/app/apps/agency && yarn test

# Build applications
RUN cd /var/app/apps/travel && ember build --env $stage
RUN cd /var/app/apps/agency && export NODE_ENV=production && webpack

# Set the default directory for our environment
WORKDIR /var/app

# Expose port 8000 for uwsgi or node
EXPOSE 8000
