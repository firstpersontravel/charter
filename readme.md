# Charter

## Local Setup

### Prerequisites

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

    # create a local env
    mkdir -p secrets
    cp deploy/example.env secrets/local.env

### Local docker setup

    # Rebuild if you add new modules
    docker build . -t fpt:latest
    docker-compose up -d

### Build js apps locally

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

### Migrations

    # Run migrations
    docker-compose exec server sequelize db:migrate

    # Create a new migration
    docker-compose exec server sequelize migration:generate --name add-some-fields

    # Run script migrations
    docker-compose run server npm run scripts:migrate

### Random tips

    # If the docker clock gets out of sync:
    docker run --rm --privileged alpine hwclock -s

    # Clear contaniers
    docker kill $(docker ps -q)
    docker rm $(docker ps -a -q)
    docker rmi $(docker images -q) --force
    docker volume ls -qf dangling=true | xargs docker volume rm

    # Clean non-tracked cruft
    git clean -xdf

## Build for production

### Building locally for production

    npm run build
    open "http://localhost:5001/travel"

### Deploying with terraform

    export AWS_PROFILE=fpt
    export GIT_HASH=`aws ecr describe-images --region us-west-2 --repository-name charter --output text --query 'sort_by(imageDetails,& imagePushedAt)[*].imageTags[*]' | tr '\t' '\n' | tail -1`
    deploy/ecs/render_task.py staging $GIT_HASH true | jq .containerDefinitions > deploy/terraform/environments/staging/containers.json

    cd deploy/terraform/environments/staging
    terraform init
    terraform plan

## Native app

### Set up native app

    cd native/ios/Traveler
    pod install

### Build native app

    # run local tunnel
    ngrok http -subdomain=firstpersontravel 5001

    # build travel app in xcode

## Debugging

### Getting a nice console

    dc exec server node --experimental-repl-await

### Creating a user

    node ./cmd/create-org.js <name> <title>
    node ./cmd/create-user.js <org-name> <email> <pw>

## Todo later:
    
    - https://gojs.net/latest/index.html
    - https://github.com/projectstorm/react-diagrams
    - https://github.com/parcel-bundler/parcel
    - https://thecode.pub/easy-deploy-your-docker-applications-to-aws-using-ecs-and-fargate-a988a1cc842f
    - http://vilkeliskis.com/blog/2016/02/10/bootstrapping-docker-with-terraform.html
    - https://rhasspy.readthedocs.io/en/latest/
    - swc instead of babel
