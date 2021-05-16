import { connect, disconnect, connection } from "mongoose";

export const mongooseInit = () => {
    const mongooseConnect = () => {
        connect(`${process.env.MONGO_URL}/${process.env.DATABASE_NAME}`, {
            useNewUrlParser: true,
            ignoreUndefined: true,
        });
    };

    connection.on("error", () => {
        disconnect();
    });

    connection.once("open", function () {
        console.log("Successfully connected to the DB");
    });

    // Auto reconnect.
    connection.on("disconnected", () => {
        setTimeout(mongooseConnect, 10240);
    });

    mongooseConnect();
};
