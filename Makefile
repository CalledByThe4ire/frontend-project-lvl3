install:
	npm install

build:
	npm run build

develop:
	npm run start

test:
	npm test

lint:
	npx eslint . --fix

.PHONY: test
