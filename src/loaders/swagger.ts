import { Application } from "express";
import * as swaggerUi from "swagger-ui-express";
import swaggerDocument from "../../build/swagger.json";

export default async (app: Application) => {
    try {
        app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } catch (error) {
        console.error("Unable to read swagger.json", error);
    }
};
