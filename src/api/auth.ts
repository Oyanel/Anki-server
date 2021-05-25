import { Request, Response } from "express";
import { IUserBase, IUserRegistration } from "../models/authentication/User/IUser";
import { loginService, refreshTokenService } from "../services/authService";
import { isEmail, isStrongPassword, isJWT } from "validator";
import { sendError } from "../utils/error/error";
import { HttpError, EHttpStatus } from "../utils";
import { validateUsername } from "../models/authentication/User/validate";
import { registerService } from "../services/userService";

export const login = async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        if (!email || !password || !isEmail(email)) {
            return sendError(res, new HttpError(EHttpStatus.UNAUTHORIZED, "Email or Password invalid"));
        }

        const user: IUserBase = {
            email: req.body.email,
            password: req.body.password,
        };

        const token = await loginService(user);

        return res.json(token);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const register = async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;

    try {
        if (!isEmail(email)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Email invalid"));
        }

        if (!isStrongPassword(password)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Password invalid"));
        }

        if (!validateUsername(username)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Username incorrect"));
        }

        const user: IUserRegistration = {
            email,
            password,
            username,
        };

        await registerService(user);

        return res.sendStatus(EHttpStatus.CREATED);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
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
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};
