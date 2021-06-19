import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import loaders from "./loaders";
import { RegisterRoutes } from "./routes";
import { EHttpStatus, HttpError } from "./utils";
import { sendError } from "./utils/error/error";
import { ValidateError } from "tsoa";

async function startServer() {
    try {
        const app = express();

        await loaders(app);

        RegisterRoutes(app);

        app.use(function errorHandler(
            err: HttpError | ValidateError,
            req: Request,
            res: Response,
            next: NextFunction
        ): Response | void {
            if (err instanceof HttpError) {
                return sendError(res, err);
            }

            if (err instanceof ValidateError) {
                const error = new HttpError(EHttpStatus.BAD_REQUEST, "Invalid parameters");

                return sendError(res, error);
            }

            next();
        });

        app.use(function notFoundHandler(_req, res) {
            const error = new HttpError(EHttpStatus.NOT_FOUND, "Not Found");

            return sendError(res, error);
        });

        app.listen(process.env.PORT, () => {
            console.log(`Your server is ready on port : ${process.env.PORT} !`);
        });
    } catch (err) {
        console.error(err);
    }
}

startServer();
