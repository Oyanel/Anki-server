import { Application, Router } from "express";
import { EHttpStatus, HttpError, verifyToken } from "../utils";
import { login, refreshToken, register } from "./auth";
import { sendError } from "../utils/error/error";
import { deleteCard, getCard, getCards, reviewCard, updateCard } from "./card";
import { addCard, createDeck, deleteDeck, getDeck, searchDecks, updateDeck } from "./deck";
import { test } from "./test";

export const routes = (app: Application) => {
    const publicRouter = Router();
    const privateRouter = Router();

    // Public routes
    publicRouter.post("/auth/login", login);
    publicRouter.post("/auth/register", register);
    publicRouter.post("/auth/token/refresh", refreshToken);
    publicRouter.get("/test", test);

    // Private routes

    // Cards
    privateRouter.get("/cards", getCards);
    privateRouter.get("/cards/:cardId", getCard);
    privateRouter.put("/cards/:cardId", updateCard);
    privateRouter.post("/cards/:cardId/review", reviewCard);
    privateRouter.delete("/cards/:cardId", deleteCard);

    // Deck
    privateRouter.get("/decks/search", searchDecks);
    privateRouter.post("/decks", createDeck);
    privateRouter.put("/decks/:deckId", updateDeck);
    privateRouter.delete("/decks/:deckId", deleteDeck);
    privateRouter.get("/decks/:deckId", getDeck);
    privateRouter.post("/decks/:deckId/cards", addCard);

    app.use("/api/v1", publicRouter);
    app.use("/api/v1/private/auth", verifyToken, privateRouter);
    // Send Not Found error if no route is found.
    app.use((req, res) => {
        const error = new HttpError(EHttpStatus.NOT_FOUND, "Not Found");
        sendError(res, error);
    });
};
