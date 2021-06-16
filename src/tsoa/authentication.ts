import { Request } from "express";
import { EHttpStatus, HttpError } from "../utils";
import { verify } from "jsonwebtoken";

export const expressAuthentication = (req: Request): Promise<unknown> => {
    const authorization = req.headers.authorization;

    return new Promise((resolve, reject) => {
        verify(authorization.split(" ")[1], process.env.APP_PRIVATE_TOKEN, (error, decoded) => {
            if (error) {
                reject(new HttpError(EHttpStatus.UNAUTHORIZED, "Unauthorized, token missing or malformed"));
            } else {
                resolve(decoded);
            }
        });
    });
};
