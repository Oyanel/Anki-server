import { connect, disconnect, connection } from "mongoose";
import { logError } from "../utils/error/error";

export const mongooseInit = () => {
    const mongooseConnect = () => {
        console.log(
            `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_URL}/${process.env.DATABASE_NAME}`
        );
        connect(
            `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_URL}/${process.env.DATABASE_NAME}`,
            {
                useNewUrlParser: true,
                ignoreUndefined: true,
            }
        )
            .then(() => {
                console.log("Successfully connected to the DB");
            })
            .catch((err) => {
                logError(err);
            });
    };

    connection.on("error", () => {
        disconnect();
    });
    // Auto reconnect.
    connection.on("disconnected", () => {
        setTimeout(mongooseConnect, 10240);
    });

    mongooseConnect();
};
