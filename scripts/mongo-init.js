/* eslint-disable no-undef */

print("Start #################################################################");
print(_getEnv("MONGO_ADMIN_PASSWORD"));
print("Init Database");

try {
    db.auth("root", _getEnv("MONGO_ADMIN_PASSWORD"));

    db = db.getSiblingDB(_getEnv("DATABASE_NAME_DEV"));

    db.createUser({
        user: _getEnv("MONGO_USER_DEV"),
        pwd: _getEnv("MONGO_PWD_DEV"),
        roles: [{ role: "readWrite", db: _getEnv("DATABASE_NAME_DEV") }],
    });

    db.createCollection("users");

    db = db.getSiblingDB(_getEnv("DATABASE_NAME_PROD"));

    db.createUser({
        user: _getEnv("MONGO_USER_PROD"),
        pwd: _getEnv("MONGO_PWD_PROD"),
        roles: [{ role: "readWrite", db: _getEnv("DATABASE_NAME_PROD") }],
    });

    db.createCollection("users");
} catch (e) {
    console.log(e);
}

print("END #################################################################");
