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
import { japaneseRegex, textRegex } from "../utils/validation/regex";
import { isValidObjectId } from "mongoose";
import { CARD_REVIEW_LEVEL } from "../models/Card/ICard";

export const getCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;

    if (!isValidObjectId(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        const card = await getCardService(id);

        return res.json(card);
    } catch (error) {
        return sendError(res, error);
    }
};

export const getCards = async (req: Request, res: Response) => {
    try {
        const card = await getCardsService();

        return res.json(card);
    } catch (error) {
        return sendError(res, error);
    }
};

export const updateCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;
    const front = req.body.front;
    const back = req.body.back;

    if (!isValidObjectId(id) || !japaneseRegex.test(front) || !textRegex.test(back)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        await updateCardService(id, front, back);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error);
    }
};

export const deleteCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;

    if (!isValidObjectId(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        await deleteCardService(id);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error);
    }
};

export const reviewCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;
    const review = req.body.review;

    const reviewLevel = CARD_REVIEW_LEVEL[review];

    if (reviewLevel === undefined || !isValidObjectId(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        await reviewCardService(id, reviewLevel);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error);
    }
};
