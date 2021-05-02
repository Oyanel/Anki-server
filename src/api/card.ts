import { Request, Response } from "express";
import {
    deleteCardService,
    getCardService,
    getCardsService,
    reviewCardService,
    updateCardService,
} from "../services/cardService";
import { sendError } from "../utils/error/error";
import { EHttpStatus, HttpError } from "../utils";
import { isValidObjectId } from "mongoose";
import { CARD_REVIEW_LEVEL } from "../models/Card/ICard";
import { sanitizeCardRequest } from "./sanitizer";

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

export const getCards = async (req: Request, res: Response) => {
    try {
        const card = await getCardsService();

        return res.json(card);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};

export const updateCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;
    const frontRequest = req.body.front;
    const backRequest = req.body.back;

    try {
        if (!isValidObjectId(id)) {
            return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card id invalid"));
        }

        const { front, back } = sanitizeCardRequest(frontRequest, backRequest);
        await updateCardService(id, front, back);

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

        await deleteCardService(id);

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

        await reviewCardService(id, reviewLevel);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error instanceof HttpError ? error : new HttpError());
    }
};
