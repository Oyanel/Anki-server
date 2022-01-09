import Card, { ICardResponse, ICreateCard, IEditCard, IQueryCard, TCardDocument } from "../models/Card";
import { EHttpStatus, HttpError } from "../utils";
import { LeanDocument, Types } from "mongoose";
import { isCardOwned } from "./deckService";
import { logError } from "../utils/error/error";
import { IPaginatedQuery, IPaginatedResponse } from "../api/common/Pagination/IPagination";
import { getUserDecks, isDeckReviewed } from "./userService";
import { createReviewService, getReviews } from "./reviewService";
import { isBefore } from "date-fns";

export const getDeckCardsService = async (deckId: string) => Card.find({ deck: deckId }).lean().exec();

export const createCardService = async (email: string, deckId: string, card: ICreateCard) => {
    const { type, back, front, example, reverseCard } = card;
    try {
        const cardDocument = new Card({
            deck: deckId,
            back,
            front,
            example,
            type,
            isReverse: reverseCard,
        });
        const promises = [];
        const newCard = await cardDocument.save();

        promises.push(
            createReviewService(email, cardDocument._id, false).catch((error) => {
                cardDocument.deleteOne();
                throw error;
            })
        );
        if (reverseCard) {
            promises.push(
                createReviewService(email, cardDocument._id, true).catch((error) => {
                    cardDocument.deleteOne();
                    throw error;
                })
            );
        }

        await Promise.all(promises);

        return getCardResponse(newCard);
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

export const updateCardService = async (email: string, id: string, card: IEditCard) => {
    const { front, back, example } = card;

    if (!(await isCardOwned(email, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (!front.some((field) => field) && !back.some((field) => field)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The front and back fields cannot be empty");
    }

    return Card.findById(new Types.ObjectId(id))
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

export const deleteCardService = (email: string, cardId: string) =>
    Card.findById(new Types.ObjectId(cardId)).then(async (card) => {
        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!(await isCardOwned(email, cardId))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }

        card.deleteOne();
    });

export const searchCardsService = async (
    email: string,
    query: IPaginatedQuery<IQueryCard>,
    overrideSecurity?: boolean
): Promise<IPaginatedResponse<ICardResponse[]>> => {
    const { privateDecks, reviewedDecks } = await getUserDecks(email);
    const { ids, name, deck, toReview, limit, skip } = query;
    const nameCondition = { $in: new RegExp(name ?? "", "i") };

    if (!overrideSecurity && deck && !(await isDeckReviewed(email, deck))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    const conditions = {
        _id: ids?.length ? { $in: ids } : undefined,
        deck: deck ?? { $in: privateDecks.concat(reviewedDecks) },
        $or: [{ front: nameCondition }, { back: nameCondition }, { example: nameCondition }],
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const cardCount = Card.countDocuments(conditions).exec();

    return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        content: await Card.find(conditions)
            .skip(skip)
            .limit(limit)
            .lean()
            .exec()
            .then(async (cardDocuments) => {
                if (!cardDocuments) {
                    return [];
                }
                const cardIds = cardDocuments.map((cardDocument) => cardDocument._id);
                const reviewList = await getReviews(email, cardIds, toReview);

                const cards = cardDocuments.map((cardDocument) => {
                    const reviews = reviewList.filter(
                        (review) => review.card.toString() === cardDocument._id.toString()
                    );
                    const isToReview = reviews.some(
                        (review) => !review.isReverse && isBefore(review.nextReview, new Date())
                    );
                    const isReverseToReview = reviews.some(
                        (review) => review.isReverse && isBefore(review.nextReview, new Date())
                    );

                    return getCardResponse(cardDocument, isToReview, isReverseToReview);
                });

                if (toReview) {
                    return cards.filter((card) => card.toReview || card.reverseToReview);
                }

                return cards;
            }),
        totalElements: await cardCount,
    };
};

export const getCardIdsByDeckId = (deckId: string) =>
    Card.find({ deck: deckId })
        .lean()
        .exec()
        .then((cardDocuments) => {
            if (!cardDocuments) {
                return [];
            }

            return cardDocuments.map((cardDocument) => cardDocument._id.toString());
        });

const getCardResponse = (
    cardDocument: TCardDocument | LeanDocument<TCardDocument>,
    toReview?: boolean,
    reverseToReview?: boolean
): ICardResponse => ({
    id: cardDocument._id,
    deck: cardDocument.deck,
    back: cardDocument.back,
    front: cardDocument.front,
    example: cardDocument.example,
    type: cardDocument.type,
    toReview,
    reverseToReview,
    isReverse: cardDocument.isReverse,
});
