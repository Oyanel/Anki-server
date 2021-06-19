/* eslint-disable no-undef */

print("Start #################################################################");
print("Init Database");

try {
    db.auth("root", "root");

    db = db.getSiblingDB("anki_dev");

    db.createUser({
        user: "anki_dev",
        pwd: "anki_dev",
        roles: [{ role: "readWrite", db: "anki_dev" }],
    });

    db.createCollection("users");

    db = db.getSiblingDB("anki_prod");

    db.createUser({
        user: "anki_prod",
        pwd: "anki_prod",
        roles: [{ role: "readWrite", db: "anki_prod" }],
    });

    db.createCollection("users");
} catch (e) {
    console.log(e);
}

print("END #################################################################");
