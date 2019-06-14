## Agency server

### Prerequisites

    # install via brew
    brew install node
    brew install awscli

    # install fabric
    pip install fabric==1.14.0 termcolor boto jinja2

    # set up n
    npm install -g n
    n 10.15.3
    npm install -g bower

    # install webpack
    brew install yarn --without-node
    yarn global add webpack

    # set up pre-commit hook
    cp precommit.sh ./.git/hooks/pre-commit

### Local docker setup

    # Rebuild if you add new modules
    docker build . -t fpt:latest
    docker-compose up -d

### Build js apps locally

    # download secrets
    yarn run download_secrets

    # setup core
    cd fptcore
        yarn install

    # setup travel
    cd apps/travel
        yarn install
        bower install
        rm -rf node_modules/fptcore
        ln -s `pwd`/../../fptcore ./node_modules

    # setup agency
    cd apps/agency
        yarn install
        rm -rf node_modules/fptcore
        ln -s `pwd`/../../fptcore ./node_modules

    # run tests
    yarn test

    # watch all local apps in parallel
    yarn run watch

    # Run agency only
    cd apps/agency
    webpack-dev-server

    # show logs in HQ tests
    SHOW_TEST_LOGS=1 yarn run test_hq

### Migrations

    # Run migrations
    docker-compose exec server sequelize db:migrate

    # Create a new migration
    docker-compose exec server sequelize migration:generate --name add-some-fields

    # Run script migrations
    docker-compose run server yarn run scripts:migrate

### Random tips

    # If the docker clock gets out of sync:
    docker run --rm --privileged alpine hwclock -s

    # Clear contaniers
    docker kill $(docker ps -q)
    docker rm $(docker ps -a -q)
    docker rmi $(docker images -q)
    docker volume ls -qf dangling=true | xargs docker volume rm

    # Clean non-tracked cruft
    git clean -xdf

### Build for production

    # build for production
    yarn run build
    open "http://localhost:5000/travel"

### Set up native app

    cd native/ios/Traveler
    pod install

### Build native app
    
    # run local tunnel
    ngrok http -subdomain=firstpersontravel 5000

    # build travel app in xcode

### Getting a nice console

    dc exec server node --experimental-repl-await

### Creating a user

    dc exec server node

    const email = "NEW_EMAIL";
    const pw = "NEW_PASSWORD";

    const bcrypt = require('bcrypt');
    const models = require('./src/models');

    // Creating a user
    bcrypt.hash(pw, 10).then((hash) => {
      console.log('Password hash: ' + hash);
    });

### Todo later:
    
    - https://github.com/parcel-bundler/parcel
    - https://thecode.pub/easy-deploy-your-docker-applications-to-aws-using-ecs-and-fargate-a988a1cc842f
    - http://vilkeliskis.com/blog/2016/02/10/bootstrapping-docker-with-terraform.html
