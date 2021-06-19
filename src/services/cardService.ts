import { ICard, ICardResponse, IQueryCard, TCardDocument } from "../models/Card/ICard";
import Card from "../models/Card";
import { EHttpStatus, HttpError } from "../utils";
import { LeanDocument, Types } from "mongoose";
import { isCardOwned } from "./deckService";
import { logError } from "../utils/error/error";
import { IPaginatedQuery } from "../api/common/Pagination/IPagination";
import { TUserResponse } from "../models/authentication/User/IUser";
import { createReviewService } from "./reviewService";

export const createCardService = async (
    user: TUserResponse,
    deckId: String,
    front: String[],
    back: String[],
    example: String,
    hasReversedCard: boolean
) => {
    const newCard: ICard = {
        deck: deckId,
        back,
        front,
        example,
    };
    const promises = [];
    const cards = [];

    try {
        const cardDocument = await Card.create<ICard>(newCard);
        const promiseReview = createReviewService(user, cardDocument._id).catch((error) => {
            cardDocument.deleteOne();
            throw error;
        });

        promises.push(promiseReview);
        cards.push(getCardResponse(cardDocument));

        if (hasReversedCard) {
            const reversedCard = getNewReversedCard(cardDocument);
            const reversedCardDocument = await Card.create<ICard>(reversedCard);
            const promiseReversedReview = createReviewService(user, reversedCardDocument._id).catch((error) => {
                reversedCardDocument.deleteOne();
                throw error;
            });
            cards.push(getCardResponse(reversedCardDocument));
            promises.push(promiseReversedReview);
        }

        await Promise.all(promises);

        return cards;
    } catch (error) {
        logError(error);
        throw error;
    }
};

export const getCardService = async (userDecks: String[], id: string) => {
    if (!(await isCardOwned(userDecks, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    return Card.findById(Types.ObjectId(id)).then((cardDocument) => {
        if (!cardDocument) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        return getCardResponse(cardDocument);
    });
};

export const updateCardService = async (
    userDecks: String[],
    id: string,
    front: String[],
    back: String[],
    example: String
) => {
    if (!(await isCardOwned(userDecks, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    Card.findById(Types.ObjectId(id))
        .exec()
        .then(async (cardDocument) => {
            if (!cardDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
            }
            cardDocument.front = front;
            cardDocument.back = back;
            cardDocument.example = example;
            await cardDocument.save();
        });
};

export const deleteCardService = async (userDecks: String[], id: string) =>
    Card.findById(Types.ObjectId(id)).then(async (card) => {
        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!(await isCardOwned(userDecks, id))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }

        card.deleteOne();
    });

export const searchCardsService = async (userDecks: String[], query: IPaginatedQuery<IQueryCard>) => {
    const { name, reverse, toReview, limit, skip } = query;
    const nameCondition = { $in: new RegExp(name ?? "", "i") };
    let nextReviewCondition, reverseCondition;

    if (toReview !== undefined) {
        nextReviewCondition = toReview ? { $lt: new Date() } : { $gt: new Date() };
    }

    if (reverse !== undefined) {
        reverseCondition = { $exists: reverse };
    }

    const conditions = {
        deck: { $in: userDecks },
        $or: [{ front: nameCondition }, { back: nameCondition }],
        nextReview: nextReviewCondition,
        referenceCard: reverseCondition,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Card.find(conditions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec()
        .then((cardDocuments) => cardDocuments.map((cardDocument) => getCardResponse(cardDocument)));
};

const getNewReversedCard = (card: TCardDocument) => {
    const reservedCard: ICard = {
        deck: card.deck,
        front: card.back,
        back: card.front,
        example: card.example,
        referenceCard: card._id,
    };

    return reservedCard;
};

const getCardResponse = (cardDocument: TCardDocument | LeanDocument<TCardDocument>) => {
    const card: ICardResponse = {
        id: cardDocument._id,
        deck: cardDocument.deck,
        back: cardDocument.back as String[],
        front: cardDocument.front as String[],
        example: cardDocument.example,
        isReversed: Boolean(cardDocument.referenceCard),
    };

    return card;
};
