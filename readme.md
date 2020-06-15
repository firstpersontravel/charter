## Agency server

### Prerequisites

```sh
# install via brew
brew install node
brew install awscli

# install fabric
pip install fabric==1.14.0 termcolor boto jinja2

# set up n
npm install -g n
n 12.5.0
npm install -g bower

# install webpack
npm install -g webpack

# set up pre-commit hook
cp precommit.sh ./.git/hooks/pre-commit

# create a minimal local env (fill in )
mkdir -p secrets
cat << EOF > secrets/local.env
JWT_SECRET=

DATABASE_HOST=mysql
DATABASE_NAME=galaxy
DATABASE_USER=galaxy
DATABASE_PASSWORD=galaxypassword

STAGE=development
NODE_ENV=development

SERVER_PORT=5001
SERVER_PUBSUB_URL=http://pubsub:5002

PUBSUB_PORT=5002

APP_PUBLIC_URL=http://localhost:5001

TWILIO_ENABLED=false
TWILIO_SID=
TWILIO_AUTHTOKEN=
TWILIO_HOST=http://firstpersontravel.ngrok.io
TWILIO_MEDIA_HOST=http://firstpersontravel.ngrok.io/media

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

S3_CONTENT_BUCKET=fpt-agency-content-local

FRONTEND_GOOGLE_API_KEY=
FRONTEND_SENTRY_DSN=
FRONTEND_SENTRY_ENVIRONMENT=development
FRONTEND_SERVER_URL=http://localhost:5001
FRONTEND_PUBSUB_URL=http://localhost:5002
FRONTEND_ANALYTICS_ENABLED=false

SENTRY_DSN=
SENTRY_ENVIRONMENT=

SENDGRID_API_KEY=

GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=

APNS_ENABLED=false
APNS_SANDBOX=true
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_TOKEN_PATH=secrets/apns/token.p8
EOF
```

### Local docker setup

# Rebuild if you add new modules
docker build . -t fpt:latest
docker-compose up -d

### Build js apps locally

```
# download secrets
npm run download_secrets

# setup core
cd fptcore
    npm install

# setup travel
cd apps/travel
    npm install
    bower -q install
    ln -s `pwd`/../../fptcore ./node_modules

# setup agency
cd apps/agency
    npm install

# run tests
npm test

# watch all local apps in parallel
npm run watch

# Run agency only
cd apps/agency
webpack-dev-server

# show logs in HQ tests
SHOW_TEST_LOGS=1 npm run test_hq
```

### Migrations

```
# Run migrations
docker-compose exec server sequelize db:migrate

# Create a new migration
docker-compose exec server sequelize migration:generate --name add-some-fields

# Run script migrations
docker-compose run server npm run scripts:migrate
```

### Random tips

```
# If the docker clock gets out of sync:
docker run --rm --privileged alpine hwclock -s

# Clear contaniers
docker kill $(docker ps -q)
docker rm $(docker ps -a -q)
docker rmi $(docker images -q) --force
docker volume ls -qf dangling=true | xargs docker volume rm

# Clean non-tracked cruft
git clean -xdf
```

### Build for production

```
# build for production
npm run build
open "http://localhost:5001/travel"
```

### Set up native app

```
cd native/ios/Traveler
pod install
```

### Build native app

```    
# run local tunnel
ngrok http -subdomain=firstpersontravel 5001

# build travel app in xcode
```

### Getting a nice console

```
dc exec server node --experimental-repl-await
```

### Creating a user

```
node ./cmd/create-org.js <name> <title>
node ./cmd/create-user.js <org-name> <email> <pw>
```

### Todo later:
    
    - https://gojs.net/latest/index.html
    - https://github.com/projectstorm/react-diagrams
    - https://github.com/parcel-bundler/parcel
    - https://thecode.pub/easy-deploy-your-docker-applications-to-aws-using-ecs-and-fargate-a988a1cc842f
    - http://vilkeliskis.com/blog/2016/02/10/bootstrapping-docker-with-terraform.html
    - https://rhasspy.readthedocs.io/en/latest/
    - swc instead of babel
