import { Request, Response } from "express";
import { sendError } from "../utils/error/error";
import { EHttpStatus, getCurrentUser, HttpError } from "../utils";
import {
    addCardService,
    createDeckService,
    deleteDeckService,
    getDeckService,
    searchDecksService,
    updateDeckService,
} from "../services/deckService";
import { validateDescription, validateName } from "../models/Deck/validate";
import { isValidObjectId } from "mongoose";
import { sanitizeCardUpdateRequest, sanitizeDeckRequest, sanitizeDeckQueryRequest } from "./sanitizer";

export const addCard = async (req: Request, res: Response) => {
    const id = req.params.deckId;

    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid"));
        }

        const { front, back } = sanitizeCardUpdateRequest(req);

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
        const newCard = await addCardService(user.email.valueOf(), id, front, back);

        return res.status(EHttpStatus.CREATED).json(newCard);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const createDeck = async (req: Request, res: Response) => {
    const nameRequest = req.body.name;
    const descriptionRequest = req.body.description;

    const { name, description } = sanitizeDeckRequest(nameRequest, descriptionRequest);

    try {
        if (!validateName(name) || !validateDescription(description)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Deck invalid"));
        }

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);

        const newDeck = await createDeckService(user.email.valueOf(), name, description);

        return res.status(EHttpStatus.CREATED).json(newDeck);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const getDeck = async (req: Request, res: Response) => {
    const id = req.params.deckId;

    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
        }

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
        const deck = await getDeckService(user.email.valueOf(), id);

        return res.json(deck);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const updateDeck = async (req: Request, res: Response) => {
    try {
        const id = req.params.deckId;
        const nameRequest = req.body.name;
        const descriptionRequest = req.body.description;

        const { name, description } = sanitizeDeckRequest(nameRequest, descriptionRequest);

        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid"));
        }

        if (!validateName(name) || !validateDescription(description)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card invalid"));
        }

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
        await updateDeckService(user.email.valueOf(), id, name, description);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const deleteDeck = async (req: Request, res: Response) => {
    try {
        const id = req.params.deckId;

        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
        }

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
        await deleteDeckService(user.email.valueOf(), id);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const searchDecks = async (req: Request, res: Response) => {
    try {
        const query = sanitizeDeckQueryRequest(req);
        const decks = await searchDecksService(query);

        return res.json(decks);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};
