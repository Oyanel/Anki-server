import { Request, Response } from "express";
import { addCardService, getCardService, updateCardService } from "../services/cardService";
import { sendError } from "../utils/error/error";
import { EHttpStatus, HttpError } from "../utils";
import { isAlphanumeric } from "validator";
import { japaneseRegex, textRegex } from "../utils/validation/regex";

export const addCard = async (req: Request, res: Response) => {
    const front = req.body.front;
    const back = req.body.back;

    if (!japaneseRegex.test(front) || !textRegex.test(back)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Card invalid"));
    }

    try {
        const newCard = await addCardService(front, back);

        return res.status(EHttpStatus.CREATED).json(newCard);
    } catch (error) {
        return sendError(res, error);
    }
};

export const getCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;

    if (!isAlphanumeric(id)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        const card = await getCardService(id);

        return res.json(card);
    } catch (error) {
        return sendError(res, error);
    }
};

export const updateCard = async (req: Request, res: Response) => {
    const id = req.params.cardId;
    const front = req.body.front;
    const back = req.body.back;

    if (!isAlphanumeric(id) || !japaneseRegex.test(front) || !textRegex.test(back)) {
        return sendError(res, new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request"));
    }

    try {
        await updateCardService(id, front, back);

        return res.sendStatus(EHttpStatus.NO_CONTENT);
    } catch (error) {
        return sendError(res, error);
    }
};
