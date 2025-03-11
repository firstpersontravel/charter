# Charter

## Local Setup

### Install prerequisites

```sh
# Install basics with homebrew
brew install node awscli

# Set up python (needed for node-gyp)
pyenv install 3.13.1
pyenv virtualenv 3.13.1 charter
pyenv global 3.13.1
pip install setuptools

# Set up nvm
nvm install 22.14.0
nvm use 22.14.0
```

### Set up environment

```sh
# Set up pre-commit hook
cp precommit.sh ./.git/hooks/pre-commit

# Create a local env
mkdir -p secrets
cp example.env secrets/local.env

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

# Run tests showing all log output
SHOW_TEST_LOGS=1 npm test

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

## Build for production

### Building locally for production

```sh
npm run build
open "http://localhost:5001/travel2"
```

### Deploy to production

```sh
git branch -f production HEAD
git push origin production
```

## Debugging

### Test local environment from a device

```sh
# run local tunnel
ngrok http --subdomain=fpt 5001
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
- https://reactflow.dev/
