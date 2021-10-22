import { urlencoded, json } from "body-parser";
import cors from "cors";
import { Application } from "express";
import logger from "morgan";
import { loggerConfig } from "../utils/logger/httpLogger";
import cookieParser from "cookie-parser";

export default async (app: Application) => {
    app.get("/status", (req, res) => {
        res.status(200).end();
    });
    app.head("/status", (req, res) => {
        res.status(200).end();
    });

    app.enable("trust proxy");

    app.use(cors());
    app.use(
        logger("combined", {
            stream: loggerConfig,
            skip: (req, res) => {
                return res.statusCode < 400;
            },
        })
    );
    app.use(json());
    app.use(cookieParser());
    app.use(urlencoded({ extended: false }));

    return app;
};
