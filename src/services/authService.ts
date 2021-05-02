import Token from "../models/authentication/Token";
import User from "../models/authentication/User";
import { IToken } from "../models/authentication/Token/IToken";
import { IUser } from "../models/authentication/User/IUser";
import { sign, verify } from "jsonwebtoken";
import "dotenv";
import { EHttpStatus, HttpError } from "../utils";
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

    Token.findOneAndReplace({ user: user.username }, tokenModel, { upsert: true });

    return tokenModel;
};

const generateToken = async (user: IUser) => {
    delete user.password;
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
                throw new HttpError(EHttpStatus.UNAUTHORIZED, "Username or password incorrect.");
            }
            const isEqual = await compare(user.password, userResponse.password);
            if (!isEqual) {
                throw new HttpError(EHttpStatus.UNAUTHORIZED, "Password incorrect.");
            }

            return await generateToken(user);
        });

const isUserExisting = (username: String) => User.countDocuments({ username }).then((count) => count > 0);

export const registerService = async (user: IUser) => {
    if (await isUserExisting(user.username)) {
        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "Username already exists");
    }

    user.password = hashSync(user.password, SALT_ROUND);

    await User.create<IUser>(user);
};

export const refreshTokenService = async (refreshToken: String) => {
    const tokenContent = verify(refreshToken, process.env.APP_PUBLIC_TOKEN);

    return await generateToken(tokenContent.user);
};
