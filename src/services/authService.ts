import Token, { IToken } from "../models/authentication/Token";
import User, { IUserBase, IUserResponse, TUserDocument } from "../models/authentication/User";
import { sign, verify } from "jsonwebtoken";
import "dotenv";
import { EHttpStatus, HttpError } from "../utils";
import { compare } from "bcryptjs";
import { addMinutes, addMonths } from "date-fns";
import { LeanDocument } from "mongoose";

const saveToken = async (accessToken: string, refreshToken: string, email: string) => {
    const tokenModel: IToken = {
        user: email,
        accessToken: accessToken,
        refreshToken: refreshToken,
        accessTokenExpiresAt: addMinutes(new Date(), 60),
        refreshTokenExpiresAt: addMonths(new Date(), 3),
    };

    await Token.findOneAndReplace({ user: email }, tokenModel, { upsert: true }).lean().exec();

    return tokenModel;
};

const generateToken = async (user: IUserResponse) => {
    const { email, username } = user;
    const accessToken = sign({ email, username }, process.env.APP_PRIVATE_TOKEN, { expiresIn: "1h" });
    const refreshToken = sign({ email, username }, process.env.APP_PUBLIC_TOKEN, { expiresIn: "12w" });

    return saveToken(accessToken, refreshToken, email);
};

export const loginService = async (user: IUserBase) =>
    User.findOne({
        email: user.email,
    })
        .lean()
        .exec()
        .then(async (userDocument) => {
            if (!userDocument) {
                throw new HttpError(EHttpStatus.UNAUTHORIZED, "Email or password incorrect.");
            }
            const isEqual = await compare(user.password, userDocument.password);
            if (!isEqual) {
                throw new HttpError(EHttpStatus.UNAUTHORIZED, "Email or password incorrect.");
            }

            return generateToken(getUserResponse(userDocument));
        });

export const refreshTokenService = async (refreshToken: string) => {
    const tokenContent: IUserResponse = verify(refreshToken, process.env.APP_PUBLIC_TOKEN);

    return generateToken(tokenContent);
};

export const removeTokenService = async (user: string) => Token.deleteOne({ user }).exec();

const getUserResponse = (userDocument: TUserDocument | LeanDocument<TUserDocument>): IUserResponse => ({
    username: userDocument.profile.username,
    email: userDocument.email,
});
