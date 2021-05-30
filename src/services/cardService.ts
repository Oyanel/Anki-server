import { ICard, ICardResponse, IQueryCard, TCardDocument } from "../models/Card/ICard";
import { addDays, differenceInDays } from "date-fns";
import Card from "../models/Card";
import Review from "../models/Review";
import { EHttpStatus, HttpError } from "../utils";
import { LeanDocument, Types } from "mongoose";
import { isCardOwned } from "./deckService";
import { ICardReview, IReviewResponse, TReviewDocument } from "../models/Review/IReview";
import { logError } from "../utils/error/error";
import { IPagination } from "../api/common/Pagination/IPagination";

export const createCardService = async (deckId: String, front: String[], back: String[], hasReversedCard: boolean) => {
    const newCard: ICard = {
        deck: deckId,
        back,
        front,
    };
    const promises = [];
    const cards = [];

    try {
        const cardDocument = await Card.create<ICard>(newCard);
        const promiseReview = createReview(cardDocument._id).catch((error) => {
            cardDocument.deleteOne();
            throw error;
        });

        promises.push(promiseReview);
        cards.push(getCardResponse(cardDocument));

        if (hasReversedCard) {
            const reversedCard = getNewReversedCard(cardDocument);
            const reversedCardDocument = await Card.create<ICard>(reversedCard);
            const promiseReversedReview = createReview(reversedCardDocument._id).catch((error) => {
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

    Card.findById(Types.ObjectId(id)).then((cardDocument) => {
        if (!cardDocument) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        return getCardResponse(cardDocument);
    });
};

export const updateCardService = async (userDecks: String[], id: string, front: String[], back: String[]) => {
    if (!(await isCardOwned(userDecks, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    Card.updateOne({ _id: Types.ObjectId(id) }, { front, back }).then((response) => {
        if (response.nModified === 0) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }
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

export const reviewCardService = async (userDecks: String[], id: string, reviewQuality: number) => {
    const promiseReview = Review.findOne({ card: Types.ObjectId(id) }).exec();
    const promiseCard = Card.findById(Types.ObjectId(id)).exec();

    return await Promise.all([promiseCard, promiseReview]).then(async (response) => {
        const card = response[0];
        const review = response[1];

        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!(await isCardOwned(userDecks, id))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }

        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!review) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Review not found for this card");
        }

        const newCardReview = getNextReview(reviewQuality.valueOf(), review);
        review.nextReview = newCardReview.nextReview;
        review.lastReview = new Date();
        review.views = newCardReview.views;
        review.easeFactor = newCardReview.easeFactor;

        await review.save();

        return getCardReviewResponse(card, review);
    });
};

export const searchCardsService = async (userDecks: String[], query: IQueryCard, pagination: IPagination) => {
    const nameCondition = { $in: new RegExp(query.name ?? "", "i") };
    let nextReviewCondition, reverseCondition;

    if (query.toReview !== undefined) {
        nextReviewCondition = query.toReview ? { $lt: new Date() } : { $gt: new Date() };
    }

    if (query.reverse !== undefined) {
        reverseCondition = { $exists: query.reverse };
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
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec()
        .then((cardDocuments) => cardDocuments.map((cardDocument) => getCardResponse(cardDocument)));
};

/**
 * Use the SM-2 algorithm.
 *
 * @param quality
 * @param review
 */
const getNextReview = (quality: number, review: TReviewDocument) => {
    let newEFactor;

    const newCardReview: ICardReview = {
        easeFactor: review.easeFactor,
        nextReview: review.nextReview,
        views: review.views.valueOf() + 1,
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

    if (review.views === 0) {
        newCardReview.nextReview = addDays(new Date(), 1);

        return newCardReview;
    }

    if (review.views === 1) {
        newCardReview.nextReview = addDays(new Date(), 6);

        return newCardReview;
    }

    newEFactor = getNewEaseFactor(review.easeFactor, quality);

    if (newEFactor < 1.3) {
        newEFactor = 1.3;
    }

    newCardReview.easeFactor = newEFactor;
    newCardReview.nextReview = addDays(
        new Date(),
        Math.min(Math.round(differenceInDays(review.nextReview, review.lastReview) * newEFactor), 365)
    );

    return newCardReview;
};

const getNewEaseFactor = (easeFactor, quality) => {
    return easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
};

const getNewReversedCard = (card: TCardDocument) => {
    const reservedCard: ICard = {
        deck: card.deck,
        front: card.back,
        back: card.front,
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
        isReversed: !!cardDocument.referenceCard,
    };

    return card;
};

const getCardReviewResponse = (
    cardDocument: TCardDocument | LeanDocument<TCardDocument>,
    review: TReviewDocument | LeanDocument<TReviewDocument>
) => {
    const cardReview: IReviewResponse = {
        id: cardDocument._id,
        deck: cardDocument.deck,
        back: cardDocument.back as String[],
        front: cardDocument.front as String[],
        isReversed: !!cardDocument.referenceCard,
        easeFactor: review.easeFactor,
        lastReview: review.lastReview,
        nextReview: review.nextReview,
        views: review.views,
    };

    return cardReview;
};

const createReview = async (cardId: String) => {
    const newReview = {
        card: cardId,
        lastReview: new Date(),
        nextReview: addDays(new Date(), 1),
        easeFactor: 2.5,
        views: 0,
    };

    await Review.create(newReview);
};
