# Anki
Server anki like

## Installation
To run the project locally, you'll need to follow these steps:

1. Download node
2. Download [Mongo](https://www.mongodb.com/try/download/community)
3. Setup your mongo DB:
- Run your mongo shell (`C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe` on Windows) then run the following commands: 
```shell
use anki
```
4. Rename your `.env.default` to `.env` and think to change the secret keys with your own

5. Run these commands:

`git clone <this repo>`

`cd ./anki-server`

`npm install`

Once the installation is completed run :

`npm run start:dev`

To develop it is recommended to use MongoDB Compass(Embedded with mongo .msi) and an IDE.

## Installation with Docker
The current configuration is made to run only in a dev mode.
It runs a mongo database and the anki server.

You'll need to follow these steps:

1. have a `DB_DATA PATH` environment variable set if you want to persist database data in a volume
2. run `docker-compose up -d`
3. Rename your `.env.default` to `.env` and think to change the secret keys with your own 

### Docker Commands

- To access a container in command line you can run `docker-compose exec [server|mongo] sh`
- To get the logs of a specific container `docker logs -f [anki-server|anki-db]`
- To restart the containers `docker-compose restart`

## Dev

If you want to update the swagger (`localhost:3000/docs` by default) run `npm run doc`.
This will regenerate the router + the swagger specs.
