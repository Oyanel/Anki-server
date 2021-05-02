import { ICard, ICardResponse, ICardReview } from "../models/Card/ICard";
import { addDays, differenceInDays } from "date-fns";
import Card from "../models/Card";
import { EHttpStatus, HttpError } from "../utils";
import { logError } from "../utils/error/error";
import { Types } from "mongoose";

export const createCardService = async (front: String, back: String) => {
    const newCard: ICard = {
        back,
        front,
        lastReview: new Date(),
        nextReview: addDays(new Date(), 1),
        easeFactor: 2.5,
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
            throw error instanceof HttpError ? error : new HttpError();
        });

export const deleteCardService = async (id: string) =>
    Card.findById(Types.ObjectId(id))
        .then((card) => {
            if (!card) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
            }
            card.remove();
        })
        .catch((error) => {
            logError(error);
            throw error instanceof HttpError ? error : new HttpError();
        });

export const reviewCardService = async (id: string, reviewQuality: number) => {
    return Card.findById(Types.ObjectId(id))
        .then((card) => {
            if (!card) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
            }

            const newCardReview = getNextReview(reviewQuality.valueOf(), card);
            card.nextReview = newCardReview.nextReview;
            card.lastReview = new Date();
            card.views = newCardReview.views;
            card.easeFactor = newCardReview.easeFactor;

            card.save();
        })
        .catch((error) => {
            logError(error);
            throw error instanceof HttpError ? error : new HttpError();
        });
};

export const getCardsService = async () =>
    Card.find()
        .lean()
        .exec()
        .then((cardDocuments) =>
            cardDocuments.map((cardDocument) => {
                const cards: ICardResponse = {
                    id: cardDocument._id,
                    back: cardDocument.back,
                    front: cardDocument.front,
                    lastReview: cardDocument.lastReview,
                    nextReview: cardDocument.nextReview,
                    views: cardDocument.views,
                };

                return cards;
            })
        )
        .catch((error) => {
            logError(error);
            throw new HttpError();
        });

/**
 * Use the SM-2 algorithm.
 *
 * @param quality
 * @param card
 */
const getNextReview = (quality: number, card: ICard) => {
    let newEFactor;

    const newCardReview: ICardReview = {
        easeFactor: card.easeFactor,
        nextReview: card.nextReview,
        views: card.views.valueOf() + 1,
    };

    if (quality < 0 || quality > 5) {
        quality = 0;
    }

    // Force to review the card a few times
    if (quality < 3) {
        newCardReview.nextReview = addDays(new Date(), 1);
        newCardReview.views = 0;

        return newCardReview;
    }

    if (card.views === 0) {
        newCardReview.nextReview = addDays(new Date(), 1);

        return newCardReview;
    }

    if (card.views === 1) {
        newCardReview.nextReview = addDays(new Date(), 6);

        return newCardReview;
    }

    newEFactor = getNewEaseFactor(card.easeFactor, quality);

    if (newEFactor < 1.3) {
        newEFactor = 1.3;
    }

    newCardReview.easeFactor = newEFactor;
    newCardReview.nextReview = addDays(
        new Date(),
        Math.min(Math.round(differenceInDays(card.nextReview, card.lastReview) * newEFactor), 365)
    );

    return newCardReview;
};

const getNewEaseFactor = (easeFactor, quality) => {
    return easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
};
