import { ICard, ICardResponse, ICardReview, IQueryCard, TCardDocument } from "../models/Card/ICard";
import { addDays, differenceInDays } from "date-fns";
import Card from "../models/Card";
import { EHttpStatus, HttpError } from "../utils";
import { LeanDocument, Types } from "mongoose";

export const createCardService = async (front: [String], back: [String]) => {
    const newCard: ICard = {
        back,
        front,
        referenceCard: undefined,
        lastReview: new Date(),
        nextReview: addDays(new Date(), 1),
        easeFactor: 2.5,
        views: 0,
    };

    return Card.create<ICard>(newCard).then(async (cardDocument) => {
        const reversedCard = getNewReversedCard(cardDocument);

        return await Card.create<ICard>(reversedCard)
            .then((reversedCardDocument) => [getCardResponse(cardDocument), getCardResponse(reversedCardDocument)])
            .catch((error) => {
                cardDocument.delete();
                throw error;
            });
    });
};

export const getCardService = async (id: string) =>
    Card.findById(Types.ObjectId(id)).then((cardDocument) => {
        if (!cardDocument) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        return getCardResponse(cardDocument);
    });

export const updateCardService = async (id: string, front: [String], back: [String]) =>
    Card.updateOne({ _id: Types.ObjectId(id) }, { front, back }).then((response) => {
        if (response.nModified === 0) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }
    });

export const deleteCardService = async (id: string) =>
    Card.findById(Types.ObjectId(id)).then((card) => {
        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }
        card.remove();
    });

export const reviewCardService = async (id: string, reviewQuality: number) => {
    return Card.findById(Types.ObjectId(id)).then((card) => {
        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        const newCardReview = getNextReview(reviewQuality.valueOf(), card);
        card.nextReview = newCardReview.nextReview;
        card.lastReview = new Date();
        card.views = newCardReview.views;
        card.easeFactor = newCardReview.easeFactor;

        card.save();
    });
};

export const searchCardsService = async (query: IQueryCard) => {
    const nameCondition = { $in: new RegExp(query.name ?? "", "i") };
    let nextReviewCondition;

    if (query.toReview !== undefined) {
        nextReviewCondition = query.toReview ? { $lt: new Date() } : { $gt: new Date() };
    }

    const conditions = {
        $or: [{ front: nameCondition }, { back: nameCondition }],
        nextReview: nextReviewCondition,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Card.find(conditions)
        .lean()
        .exec()
        .then((cardDocuments) => cardDocuments.map((cardDocument) => getCardResponse(cardDocument)));
};

export const getCardsService = async () =>
    Card.find()
        .lean()
        .exec()
        .then((cardDocuments) => cardDocuments.map((cardDocument) => getCardResponse(cardDocument)));

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

const getNewReversedCard = (card: TCardDocument) => {
    const reservedCard: ICard = {
        front: card.back,
        back: card.front,
        referenceCard: card._id,
        easeFactor: 2.5,
        nextReview: addDays(new Date(), 1),
        views: 0,
        lastReview: new Date(),
    };

    return reservedCard;
};

const getCardResponse = (cardDocument: TCardDocument | LeanDocument<TCardDocument>) => {
    const card: ICardResponse = {
        id: cardDocument._id,
        back: cardDocument.back as String[],
        front: cardDocument.front as String[],
        lastReview: cardDocument.lastReview,
        nextReview: cardDocument.nextReview,
        views: cardDocument.views,
        isReversed: !!cardDocument.referenceCard,
    };

    return card;
};
