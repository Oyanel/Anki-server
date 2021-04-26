import { ICard, ICardResponse } from "../models/Card/ICard";
import { addMinutes } from "date-fns";
import Card from "../models/Card";
import { EHttpStatus, HttpError } from "../utils";
import { logError } from "../utils/error/error";
import { Types } from "mongoose";

// export const isCardExisting = async (front: String, back: String) => {
//     return Card.countDocuments({
//         front,
//         back,
//     }).then((count) => count > 0);
// };

export const createCardService = async (front: String, back: String) => {
    const newCard: ICard = {
        back,
        front,
        lastReview: new Date(),
        nextReview: addMinutes(new Date(), 10),
        views: 0,
    };

    return Card.create<ICard>(newCard)
        .then((cardDocument) => {
            const cardResponse: ICardResponse = {
                id: cardDocument._id,
                back: cardDocument.back,
                front: cardDocument.front,
                lastReview: cardDocument.lastReview,
                nextReview: cardDocument.lastReview,
                views: cardDocument.views,
            };

            return cardResponse;
        })
        .catch((error) => {
            logError(error);
            throw new HttpError();
        });
};

export const getCardService = async (id: string) =>
    Card.findById(Types.ObjectId(id))
        .then((cardDocument) => {
            if (!cardDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
            }

            const cardResponse: ICardResponse = {
                id: cardDocument._id,
                back: cardDocument.back,
                front: cardDocument.front,
                lastReview: cardDocument.lastReview,
                nextReview: cardDocument.lastReview,
                views: cardDocument.views,
            };

            return cardResponse;
        })
        .catch((error) => {
            logError(error);
            throw error instanceof HttpError ? error : new HttpError();
        });

export const updateCardService = async (id: string, front: String, back: String) =>
    Card.updateOne({ _id: Types.ObjectId(id) }, { front, back })
        .then((response) => {
            if (response.nModified === 0) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
            }
        })
        .catch((error) => {
            logError(error);
            throw new HttpError();
        });

export const deleteCardService = async (id: string) =>
    Card.findByIdAndRemove(Types.ObjectId(id))
        .then((response) => {
            if (!response) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
            }
        })
        .catch((error) => {
            logError(error);
            throw new HttpError();
        });
