import { Request, Response } from "express";
import {
    deleteCardService,
    getCardService,
    reviewCardService,
    searchCardsService,
    updateCardService,
} from "../services/cardService";
import { logError, sendError } from "../utils/error/error";
import { EHttpStatus, getCurrentUser, HttpError } from "../utils";
import { isValidObjectId } from "mongoose";
import { sanitizeCardQueryRequest, sanitizeCardUpdateRequest } from "./sanitizer";
import { CARD_REVIEW_LEVEL } from "../models/Review/IReview";
import { getPagination } from "./common/Pagination/pagination";

export const getCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;

    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
        }

        const user = getCurrentUser(req.headers.authorization);
        const card = await getCardService(user.profile.decks, id);

        return res.json(card);
    } catch (error) {
        logError(error);

        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const searchCards = async (req: Request, res: Response) => {
    try {
        const pagination = getPagination(req);
        const query = sanitizeCardQueryRequest(req);
        const user = getCurrentUser(req.headers.authorization);
        const card = await searchCardsService(user.profile.decks, query, pagination);

        return res.json(card);
    } catch (error) {
        logError(error);

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

        const user = getCurrentUser(req.headers.authorization);
        await updateCardService(user.profile.decks, id, front, back);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        logError(error);

        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const deleteCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;
    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card id invalid"));
        }

        const user = getCurrentUser(req.headers.authorization);
        await deleteCardService(user.profile.decks, id);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        logError(error);

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

        const user = getCurrentUser(req.headers.authorization);
        await reviewCardService(user.profile.decks, id, reviewLevel);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        logError(error);

        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};
