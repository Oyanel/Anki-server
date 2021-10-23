import { verify } from "jsonwebtoken";
import { HttpError } from "../error/HttpError";
import { EHttpStatus } from "../IHttp";
import { logError } from "../error/error";

export const getCurrentUserEmail = (authorization?: string): string => {
    if (!authorization) {
        throw new HttpError(EHttpStatus.UNAUTHORIZED, "The authorization token is missing");
    }

    try {
        return verify(authorization.split(" ")[1], process.env.APP_PRIVATE_TOKEN).email;
    } catch (error) {
        logError(error);

        throw new HttpError(EHttpStatus.UNAUTHORIZED, "The provided token is missing or malformed");
    }
};
