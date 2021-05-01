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
```shell
db.createUser({
  user: "admin",
  pwd: "admin",
  roles: [
    { role: "readWrite", db: "anki" },
    { role: "dbAdmin", db: "anki" },
  ]
});
```
   
4. Run these commands:

`git clone <this repo>`

`cd ./anki-server`
`npm install`

Once the installation is completed run :

`npm run start:dev`

To develop it is recommended to use MongoDB Compass(Embedded with mongo .msi) and an IDE.
