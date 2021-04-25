import { Application, Router } from "express";
import { test } from "./test";
import { HttpError, verifyToken } from "../utils";
import { login, signup } from "./auth";

export const routes = (app: Application) => {
    const publicRouter = Router();
    const privateRouter = Router();

    //public routes
    publicRouter.post("/auth/login", login);
    publicRouter.post("/auth/signup", signup);

    //private routes
    privateRouter.use("/test", test);

    app.use("/api/v1", publicRouter);
    app.use("/api/v1/private/auth", verifyToken, privateRouter);

    // Send Not Found error if no route is found.
    app.use((req, res) => {
        const error = new HttpError(404, "Not Found");
        res.status(404).json({ error });
    });
};
