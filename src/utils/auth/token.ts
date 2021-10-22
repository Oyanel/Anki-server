import { verify } from "jsonwebtoken";
import { HttpError } from "../error/HttpError";
import { EHttpStatus } from "../IHttp";
import { logError } from "../error/error";

export const getCurrentUserEmail = (authorization: string): string => {
    try {
        return verify(authorization.split(" ")[1], process.env.APP_PRIVATE_TOKEN).email;
    } catch (error) {
        logError(error);

        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "The provided token is missing or malformed");
    }
};
