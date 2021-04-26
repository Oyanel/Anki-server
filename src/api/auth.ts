import { Request, Response } from "express";
import { IUser } from "../models/authentication/User/IUser";
import { loginService, refreshTokenService, registerService } from "../services/authService";
import { isEmail, isStrongPassword, isJWT } from "validator";
import { sendError } from "../utils/error/error";
import { HttpError, EHttpStatus } from "../utils";

export const login = async (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        if (!username || !password || !isEmail(username)) {
            return sendError(res, new HttpError(EHttpStatus.UNAUTHORIZED, "Username or Password invalid"));
        }

        const user: IUser = {
            username: req.body.username,
            password: req.body.password,
        };

        const token = await loginService(user);

        return res.json(token);
    } catch (error) {
        return sendError(res, error);
    }
};

export const register = async (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        if (!isEmail(username)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Username invalid"));
        }

        if (!isStrongPassword(password)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Password invalid"));
        }

        const user: IUser = {
            username,
            password,
        };

        await registerService(user);

        return res.sendStatus(EHttpStatus.CREATED);
    } catch (error) {
        return sendError(res, error);
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    const token = req.body.token;

    try {
        if (!isJWT(token)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
        }

        const newToken = await refreshTokenService(token);

        return res.json({ token: newToken });
    } catch (error) {
        return sendError(res, error);
    }
};
