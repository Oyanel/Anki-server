import { verify } from "jsonwebtoken";
import { HttpError } from "../error/HttpError";
import { EHttpStatus } from "../IHttp";
import { logError } from "../error/error";
import { TUserResponse } from "../../models/authentication/User/IUser";

export const getCurrentUser = (authorization: string): TUserResponse => {
    try {
        return verify(authorization.split(" ")[1], process.env.APP_PRIVATE_TOKEN).user;
    } catch (error) {
        logError(error);

        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "The provided token is missing or malformed");
    }
};
