import { ICard, ICardResponse } from "../models/Card/ICard";
import { addMinutes } from "date-fns";
import Card from "../models/Card";
import { EHttpStatus, HttpError } from "../utils";
import { logError } from "../utils/error/error";

// export const isCardExisting = async (front: String, back: String) => {
//     return Card.countDocuments({
//         front,
//         back,
//     }).then((count) => count > 0);
// };

export const addCardService = async (front: String, back: String) => {
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

export const getCardService = async (id: String) =>
    Card.findOne({ _id: id })
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
            throw new HttpError();
        });

export const updateCardService = async (id: String, front: String, back: String) =>
    Card.updateOne({ _id: id }, { front, back })
        .then((cardDocument) => {
            if (!cardDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
            }
        })
        .catch((error) => {
            logError(error);
            throw new HttpError();
        });
