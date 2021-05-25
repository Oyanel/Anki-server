import { Response } from "express";
import { HttpError } from "./HttpError";
import { logger } from "../logger/httpLogger";

export const sendError = (res: Response, error: HttpError) => {
    res.status(error.status);
    logger.error(error);

    return res.json({ error });
};

export const logError = (error: Error | HttpError) => {
    logger.error(error.message);
};
