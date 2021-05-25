import { Request, Response } from "express";
import {
    deleteCardService,
    getCardService,
    reviewCardService,
    searchCardsService,
    updateCardService,
} from "../services/cardService";
import { sendError } from "../utils/error/error";
import { EHttpStatus, getCurrentUser, HttpError } from "../utils";
import { isValidObjectId } from "mongoose";
import { CARD_REVIEW_LEVEL } from "../models/Card/ICard";
import { sanitizeCardQueryRequest, sanitizeCardUpdateRequest } from "./sanitizer";

export const getCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;

    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
        }

        const card = await getCardService(id);

        return res.json(card);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const searchCards = async (req: Request, res: Response) => {
    try {
        const query = sanitizeCardQueryRequest(req);
        const card = await searchCardsService(query);

        return res.json(card);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const updateCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;

    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card id invalid"));
        }

        const { front, back } = sanitizeCardUpdateRequest(req);

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
        await updateCardService(user.profile.decks, id, front, back);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const deleteCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;
    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card id invalid"));
        }

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
        await deleteCardService(user.profile.decks, id);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const reviewCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;
    const review = req.body.review;
    try {
        const reviewLevel = CARD_REVIEW_LEVEL[review];

        if (reviewLevel === undefined || !isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
        }

        const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
        await reviewCardService(user.profile.decks, id, reviewLevel);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};
