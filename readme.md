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
cp example.env local.env

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

## Build for production

### Building locally for production

```sh
npm run build
open "http://localhost:5001/travel"
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

- https://awslabs.github.io/diagram-maker/
- https://expo.io/
- https://github.com/luizperes/simdjson_nodejs
- https://wit.ai/docs/quickstart
- https://www.cypress.io/
- https://gojs.net/latest/index.html
- https://github.com/projectstorm/react-diagrams