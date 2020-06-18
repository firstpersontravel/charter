# setup core
cd fptcore && npm install && cd ..

# setup travel
cd apps/travel && npm install && bower -q install && ln -s `pwd`/../../fptcore ./node_modules && cd ../..

# setup agency
cd apps/agency && npm install && cd ../..

# run tests
npm test
