import { Request, Response } from "express";
import { sendError } from "../utils/error/error";
import { EHttpStatus, HttpError } from "../utils";
import {
    addCardService,
    createDeckService,
    deleteDeckService,
    getDeckService,
    updateDeckService,
} from "../services/deckService";
import { validateDescription, validateName } from "../models/Deck/validate";
import { validateBack, validateFront } from "../models/Card/validate";
import { isValidObjectId } from "mongoose";

export const addCard = async (req: Request, res: Response) => {
    const id = req.params.deckId;
    const front = req.body.front;
    const back = req.body.back;

    if (!isValidObjectId(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid"));
    }

    if (!validateFront(front) || !validateBack(back)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card invalid"));
    }

    try {
        const newCard = await addCardService(id, front, back);

        return res.status(EHttpStatus.CREATED).json(newCard);
    } catch (error) {
        return sendError(res, error);
    }
};

export const createDeck = async (req: Request, res: Response) => {
    const name = req.body.name;
    const description = req.body.description;

    if (!validateName(name) || !validateDescription(description)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Deck invalid"));
    }

    try {
        const newDeck = await createDeckService(name, description);

        return res.status(EHttpStatus.CREATED).json(newDeck);
    } catch (error) {
        return sendError(res, error);
    }
};

export const getDeck = async (req: Request, res: Response) => {
    const id = req.params.deckId;

    if (!isValidObjectId(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        const deck = await getDeckService(id);

        return res.json(deck);
    } catch (error) {
        return sendError(res, error);
    }
};

export const updateDeck = async (req: Request, res: Response) => {
    const id = req.params.deckId;
    const name = req.body.name;
    const description = req.body.description;

    if (!isValidObjectId(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid"));
    }

    if (!validateName(name) || !validateDescription(description)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card invalid"));
    }

    try {
        await updateDeckService(id, name, description);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error);
    }
};

export const deleteDeck = async (req: Request, res: Response) => {
    const id = req.params.cardId;

    if (!isValidObjectId(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        await deleteDeckService(id);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error);
    }
};
