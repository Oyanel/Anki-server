import { Request } from "express";
import { EHttpStatus, HttpError } from "../utils";
import { verify } from "jsonwebtoken";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const expressAuthentication = (req: Request, _securityName: string, _scopes?: string[]): Promise<unknown> => {
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
