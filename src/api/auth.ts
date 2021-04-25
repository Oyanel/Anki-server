import { Request, Response } from "express";
import { IUser } from "../models/authentication/User/IUser";
import { loginService, signupService } from "../services/authService";
import { isEmail, isStrongPassword } from "validator";
import { sendError } from "../utils/error/error";
import { HttpError } from "../utils";

export const login = async (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!isEmail(username) || !password) {
        return sendError(res, new HttpError(401, "Username or Password invalid"));
    }

    const user: IUser = {
        username: req.body.username,
        password: req.body.password,
    };

    try {
        const token = await loginService(user);

        return res.json({ token });
    } catch (error) {
        return sendError(res, error);
    }
};

export const signup = async (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!isEmail(username)) {
        return sendError(res, new HttpError(400, "Username invalid"));
    }

    if (!isStrongPassword(password)) {
        return sendError(res, new HttpError(400, "Password invalid"));
    }

    const user: IUser = {
        username,
        password,
    };

    try {
        await signupService(user);

        return res.sendStatus(201);
    } catch (error) {
        return sendError(res, error);
    }
};
