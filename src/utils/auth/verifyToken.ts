import { NextFunction, Request, Response } from "express";
import { verify, JsonWebTokenError } from "jsonwebtoken";
import { HttpError } from "../error/HttpError";
import { EHttpStatus } from "../IHttp";
import { sendError } from "../error/error";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const error = new HttpError(EHttpStatus.UNAUTHORIZED, "Unauthorized");

    try {
        verify(authorization.split(" ")[1], process.env.APP_PRIVATE_TOKEN);
        next();
    } catch (e) {
        if (!(e instanceof JsonWebTokenError)) {
            error.status = EHttpStatus.BAD_REQUEST;
            error.message = "Bad Request";
        }
        sendError(res, error);
    }
};
