import { Response } from "express";
import { HttpError } from "./HttpError";
import { logger } from "../logger/httpLogger";

export const sendError = (res: Response, error: HttpError) => {
    res.status(error.status);
    const originalError = { ...error };
    logger.error(error);

    return res.json({ error: originalError });
};

export const logError = (error: Error) => {
    if (error.stack) {
        logger.error(error.stack);
    }
};
