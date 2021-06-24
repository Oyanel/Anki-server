import Token, { IToken } from "../models/authentication/Token";
import User, { IUserBase, TUserDocument, TUserResponse } from "../models/authentication/User";
import { sign, verify } from "jsonwebtoken";
import "dotenv";
import { EHttpStatus, HttpError } from "../utils";
import { compare } from "bcryptjs";
import { addHours, addMinutes } from "date-fns";
import { LeanDocument } from "mongoose";

const saveToken = async (accessToken: string, refreshToken: string, user: TUserResponse) => {
    const tokenModel: IToken = {
        user: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken,
        accessTokenExpiresAt: addMinutes(new Date(), 60),
        refreshTokenExpiresAt: addHours(new Date(), 4),
    };

    await Token.findOneAndReplace({ user: user.email }, tokenModel, { upsert: true }).lean().exec();

    return tokenModel;
};

const generateToken = async (user: TUserResponse) => {
    const accessToken = sign({ user }, process.env.APP_PRIVATE_TOKEN, { expiresIn: "1h" });
    const refreshToken = sign({ user }, process.env.APP_PUBLIC_TOKEN, { expiresIn: "4h" });

    return saveToken(accessToken, refreshToken, user);
};

export const loginService = async (user: IUserBase) =>
    User.findOne({
        email: user.email,
    })
        .lean()
        .exec()
        .then(async (userDocument) => {
            if (!userDocument) {
                throw new HttpError(EHttpStatus.UNAUTHORIZED, "email or password incorrect.");
            }
            const isEqual = await compare(user.password, userDocument.password);
            if (!isEqual) {
                throw new HttpError(EHttpStatus.UNAUTHORIZED, "Password incorrect.");
            }

            return generateToken(getUserResponse(userDocument));
        });

export const refreshTokenService = async (refreshToken: string) => {
    const tokenContent = verify(refreshToken, process.env.APP_PUBLIC_TOKEN);

    return generateToken(tokenContent.user);
};

const getUserResponse = (userDocument: TUserDocument | LeanDocument<TUserDocument>): TUserResponse => ({
    profile: userDocument.profile,
    email: userDocument.email,
});
