# Charter

## Local Setup

### Install prerequisites

```sh
# Install basics with homebrew
brew install node awscli

# Set up n
npm install -g n
n 12.16.2
```

### Set up environment

```sh
# Set up pre-commit hook
cp precommit.sh ./.git/hooks/pre-commit

# Create a local env
mkdir -p secrets
cp deploy/example.env secrets/local.env

# Build docker container; rebuild if you add new modules
docker build . -t fpt:latest

# Install node dependencies
npm run install_all
```

### Run locally!

```sh
# Run backend
docker-compose up -d

# Run migrations if needed
npm run migrate

# Run tests
npm test

# Watch all local apps in parallel to rebuild on changes
npm run watch
open http://localhost:5001

# Watch docker logs
docker-compose logs -f
```

### Migrations

```sh
# Run migrations
docker-compose exec server sequelize db:migrate

# Create a new migration 
docker-compose exec server sequelize migration:generate --name add-some-fields

# Run script migrations
docker-compose run server npm run scripts:migrate
```

### Random tips

```sh
# If the docker clock gets out of sync:
docker run --rm --privileged alpine hwclock -s

# Clear contaniers
docker kill $(docker ps -q)
docker rm $(docker ps -a -q)
docker rmi $(docker images -q) --force
docker volume ls -qf dangling=true | xargs docker volume rm

# Clean non-tracked cruft
git clean -xdf

# Fix bcrypt
docker-compose exec server npm rebuild bcrypt --build-from-source
```

### Pull production DB for testing

```sh
export AWS_PROFILE=fpt
DB_HOST=fpt-agency.cg6fwudtz4v9.us-west-2.rds.amazonaws.com
DB_NAME=agency
DB_PW=`aws ssm get-parameter --name charter.production.db-password --region us-west-2 --with-decryption | jq -r .Parameter.Value`
DB_USER=`aws ssm get-parameter --name charter.production.db-user --region us-west-2 --with-decryption | jq -r .Parameter.Value`
mysqldump --column-statistics=0 -h $DB_HOST -p$DB_PW -u $DB_USER $DB_NAME --result-file=/tmp/bak.sql
mysql -u galaxy -pgalaxypassword -h 127.0.0.1 -P 4310 galaxy < /tmp/bak.sql
docker-compose exec server npm run migrate
```

### Reset staging / test DB

After pulling production db:

```sh
export AWS_PROFILE=fpt
DB_HOST=fpt-agency.cg6fwudtz4v9.us-west-2.rds.amazonaws.com

# Restore test
TEST_DB_NAME=agency_test
TEST_DB_PW=`aws ssm get-parameter --name charter.test.db-password --region us-west-2 --with-decryption | jq -r .Parameter.Value`
TEST_DB_USER=`aws ssm get-parameter --name charter.test.db-user --region us-west-2 --with-decryption | jq -r .Parameter.Value`
mysql -u $TEST_DB_USER -p$TEST_DB_PW -h $DB_HOST $TEST_DB_NAME < /tmp/bak.sql

# Restore staging
STAGING_DB_NAME=agency_staging
STAGING_DB_PW=`aws ssm get-parameter --name charter.staging.db-password --region us-west-2 --with-decryption | jq -r .Parameter.Value`
STAGING_DB_USER=`aws ssm get-parameter --name charter.staging.db-user --region us-west-2 --with-decryption | jq -r .Parameter.Value`
mysql -u $STAGING_DB_USER -p$STAGING_DB_PW -h $DB_HOST $STAGING_DB_NAME < /tmp/bak.sql
```

## Build for production

### Building locally for production

```sh
npm run build
open "http://localhost:5001/travel"
```

### Deploying with terraform

```sh
export AWS_PROFILE=fpt
export GIT_HASH=`git rev-parse origin/master`

# Test
deploy/ecs/render_task.py test $GIT_HASH true | jq .containerDefinitions > deploy/terraform/environments/test/containers.json

cd deploy/terraform/environments/test
terraform init
terraform plan

# Staging
deploy/ecs/render_task.py staging $GIT_HASH true | jq .containerDefinitions > deploy/terraform/environments/staging/containers.json

cd deploy/terraform/environments/staging
terraform init
terraform plan

# Production
deploy/ecs/render_task.py production $GIT_HASH true | jq .containerDefinitions > deploy/terraform/environments/production/containers.json

cd deploy/terraform/environments/production
terraform init
terraform plan
```

## Debugging

### Test local environment from a device

```sh
# run local tunnel
ngrok http -subdomain=fpt 5001
```

### Getting a nice console

```sh
# Node server
docker-compose exec server node --experimental-repl-await

# MySQL console
docker-compose exec mysql mysql galaxy -ugalaxy -pgalaxypassword
```

## Todo later:

- https://expo.io/
- https://github.com/luizperes/simdjson_nodejs
- https://wit.ai/docs/quickstart
- https://www.cypress.io/
- https://github.com/team-video/tragopan
- https://gojs.net/latest/index.html
- https://github.com/projectstorm/react-diagrams
