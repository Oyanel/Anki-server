import { Application, Router } from "express";
import { EHttpStatus, HttpError, verifyToken } from "../utils";
import { login, refreshToken, register } from "./auth";
import { sendError } from "../utils/error/error";
import { addCard, deleteCard, getCard, updateCard } from "./card";

export const routes = (app: Application) => {
    const publicRouter = Router();
    const privateRouter = Router();

    //public routes
    publicRouter.post("/auth/login", login);
    publicRouter.post("/auth/register", register);
    publicRouter.post("/auth/token/refresh", refreshToken);

    //private routes
    privateRouter.post("/card", addCard);
    privateRouter.get("/card/:cardId", getCard);
    privateRouter.put("/card/:cardId", updateCard);
    privateRouter.delete("/card/:cardId", deleteCard);

    app.use("/api/v1", publicRouter);
    app.use("/api/v1/private/auth", verifyToken, privateRouter);

    // Send Not Found error if no route is found.
    app.use((req, res) => {
        const error = new HttpError(EHttpStatus.NOT_FOUND, "Not Found");
        sendError(res, error);
    });
};
