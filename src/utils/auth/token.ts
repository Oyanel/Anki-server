import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { HttpError } from "../error/HttpError";
import { EHttpStatus } from "../IHttp";
import { sendError } from "../error/error";
import { TUserResponse } from "../../models/authentication/User/IUser";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    try {
        verify(authorization.split(" ")[1], process.env.APP_PRIVATE_TOKEN);
        next();
    } catch (e) {
        const error = new HttpError(EHttpStatus.UNAUTHORIZED, "Unauthorized, token missing or malformed");
        sendError(res, error);
    }
};

export const getCurrentUser = (token: string): TUserResponse => {
    try {
        return verify(token, process.env.APP_PRIVATE_TOKEN).user;
    } catch (e) {
        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "The provided token is missing or malformed");
    }
};
