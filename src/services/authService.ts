import Token from "../models/authentication/Token";
import User from "../models/authentication/User";
import { IToken } from "../models/authentication/Token/IToken";
import { IUser } from "../models/authentication/User/IUser";
import { sign } from "jsonwebtoken";
import "dotenv";
import { HttpError } from "../utils";
import { logError } from "../utils/error/error";
import { compare, hashSync } from "bcrypt";
import { SALT_ROUND } from "../constant";
import { addHours, addMinutes } from "date-fns";

const saveToken = async (accessToken: String, refreshToken: String, user: IUser) => {
    const tokenModel: IToken = {
        user: user.username,
        accessToken: accessToken,
        refreshToken: refreshToken,
        accessTokenExpiresAt: addMinutes(new Date(), 60),
        refreshTokenExpiresAt: addHours(new Date(), 4),
    };

    await Token.create<IToken>(tokenModel)
        .then((token) => token)
        .catch((error: Error) => {
            logError(error);
            throw new HttpError(500);
        });

    return tokenModel;
};

const generateToken = async (user: IUser) => {
    const accessToken = sign({ user }, process.env.APP_PRIVATE_TOKEN, { expiresIn: "1h" });
    const refreshToken = sign({ user }, process.env.APP_PUBLIC_TOKEN, { expiresIn: "4h" });

    return await saveToken(accessToken, refreshToken, user);
};

export const loginService = async (user: IUser) =>
    User.findOne({
        username: user.username,
    })
        .lean()
        .exec()
        .then(async (userResponse) => {
            if (!userResponse) {
                throw new HttpError(401, "Username or password incorrect.");
            }
            const isEqual = await compare(user.password, userResponse.password);
            if (!isEqual) {
                throw new HttpError(401, "Password incorrect.");
            }

            return await generateToken(user);
        })
        .catch((error: Error) => {
            logError(error);
            throw new HttpError(401, "Username or password incorrect.");
        });

const isUserExisting = (username: String) =>
    User.countDocuments({ username })
        .then((count) => count > 0)
        .catch((error: Error) => {
            logError(error);
            throw error;
        });

export const signupService = async (user: IUser) => {
    if (await isUserExisting(user.username)) {
        throw new HttpError(500, "Username already exists");
    }

    user.password = hashSync(user.password, SALT_ROUND);

    User.create<IUser>(user).catch((error: Error) => {
        logError(error);
        throw new HttpError(500);
    });
};
