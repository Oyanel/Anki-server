import Card, { ECardType, ICard, ICardResponse, IQueryCard, TCardDocument } from "../models/Card";
import { EHttpStatus, HttpError } from "../utils";
import { LeanDocument, Types } from "mongoose";
import { isCardOwned } from "./deckService";
import { logError } from "../utils/error/error";
import { IPaginatedQuery } from "../api/common/Pagination/IPagination";
import { getUserDecks } from "./userService";
import { createReviewService, getReviews } from "./reviewService";

export const getDeckCardsService = async (deckId: string) => Card.find({ deck: deckId }).lean().exec();

export const createCardService = async (
    email: string,
    deckId: string,
    front: string[],
    back: string[],
    example: string,
    hasReversedCard: boolean,
    type: ECardType
) => {
    const promises = [];
    const cards = [];

    try {
        const cardDocument = new Card({
            deck: deckId,
            back,
            front,
            example,
            type,
        });
        const newCard = await cardDocument.save();
        cards.push(getCardResponse(newCard));
        const promiseReview = createReviewService(email, cardDocument._id).catch((error) => {
            cardDocument.deleteOne();
            throw error;
        });
        promises.push(promiseReview);

        if (hasReversedCard) {
            const reversedCardDocument = await new Card(getNewReversedCard(cardDocument)).save();
            const promiseReversedReview = createReviewService(email, reversedCardDocument._id).catch((error) => {
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

export const getCardService = async (email: string, id: string, overrideSecurity?: boolean) => {
    if (!overrideSecurity) {
        if (!(await isCardOwned(email, id))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }
    }

    return Card.findById(new Types.ObjectId(id)).then((cardDocument) => {
        if (!cardDocument) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        return getCardResponse(cardDocument);
    });
};

export const updateCardService = async (
    email: string,
    id: string,
    front: string[],
    back: string[],
    example: string
) => {
    if (!(await isCardOwned(email, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (!front.some((field) => field) && !back.some((field) => field)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The front and back fields cannot be empty");
    }

    Card.findById(new Types.ObjectId(id))
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

export const deleteCardService = async (email: string, cardId: string) =>
    Card.findById(new Types.ObjectId(cardId)).then(async (card) => {
        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!(await isCardOwned(email, cardId))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }

        card.deleteOne();
    });

export const searchCardsService = async (email: string, query: IPaginatedQuery<IQueryCard>) => {
    const { privateDecks, reviewedDecks } = await getUserDecks(email);
    const { ids, name, deck, reverse, toReview, limit, skip } = query;
    const nameCondition = { $in: new RegExp(name ?? "", "i") };
    let reverseCondition;

    if (reverse !== undefined) {
        reverseCondition = { $exists: reverse };
    }

    const conditions = {
        _id: ids?.length ? { $in: ids } : undefined,
        deck: deck ?? { $in: privateDecks.concat(reviewedDecks) },
        $or: [{ front: nameCondition }, { back: nameCondition }, { example: nameCondition }],
        referenceCard: reverseCondition,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return await Card.find(conditions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec()
        .then(async (cardDocuments) => {
            if (!cardDocuments) {
                return [];
            }
            const cardIds = cardDocuments.map((cardDocument) => cardDocument._id);
            const cardsToReview = await getReviews(email, cardIds, toReview);
            const cardIdToReviewList = cardsToReview.map((review) => review.card.toString());
            const cards = cardDocuments.map((cardDocument) => {
                const isToReview = cardIdToReviewList.includes(cardDocument._id.toString());

                return getCardResponse(cardDocument, isToReview);
            });

            if (toReview) {
                return cards.filter((card) => card.toReview);
            }

            return cards;
        });
};

const getNewReversedCard = (card: TCardDocument): ICard => ({
    deck: card.deck,
    front: card.back,
    back: card.front,
    example: card.example,
    referenceCard: card._id,
    type: card.type,
});

const getCardResponse = (
    cardDocument: TCardDocument | LeanDocument<TCardDocument>,
    toReview?: boolean
): ICardResponse => ({
    id: cardDocument._id,
    deck: cardDocument.deck,
    back: cardDocument.back,
    front: cardDocument.front,
    example: cardDocument.example,
    type: cardDocument.type,
    referenceCard: cardDocument.referenceCard,
    toReview,
});
