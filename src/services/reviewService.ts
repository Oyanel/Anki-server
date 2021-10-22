import { addDays, differenceInDays } from "date-fns";
import Card, { TCardDocument } from "../models/Card";
import Review, {
    ECardReviewLevel,
    ECardReviewName,
    ICardReview,
    IReview,
    TReviewDocument,
    TReviewResponse,
} from "../models/Review";
import { EHttpStatus, HttpError } from "../utils";
import { FilterQuery, LeanDocument, Types } from "mongoose";
import { isCardReviewable } from "./userService";

export const isCardReviewed = (userEmail: string, cardId: string) =>
    Review.countDocuments({ user: userEmail, card: cardId }).then((count) => count > 0);

export const getReviews = async (email: string, cards: string[], toReview?: boolean) => {
    let nextReviewCondition;

    if (toReview !== undefined) {
        nextReviewCondition = toReview ? { $lt: new Date() } : { $gt: new Date() };
    }

    const condition: FilterQuery<IReview> = {
        card: { $in: cards },
        user: email,
        nextReview: nextReviewCondition,
    };

    return Review.find()
        .where(condition)
        .lean()
        .exec()
        .then((reviews) => reviews);
};

export const reviewCardService = async (email: string, id: string, reviewQuality: ECardReviewName) => {
    const promiseReview = Review.findOne({ card: id, user: email }).exec();
    const promiseCard = Card.findById(new Types.ObjectId(id)).exec();

    return Promise.all([promiseCard, promiseReview]).then(async (response) => {
        const card = response[0];
        const review = response[1] ?? (await createReviewService(email, id));

        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!(await isCardReviewable(email, id))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }

        const newCardReview = getNextReview(ECardReviewLevel[reviewQuality], review);
        review.nextReview = newCardReview.nextReview;
        review.lastReview = new Date();
        review.views = newCardReview.views;
        review.easeFactor = newCardReview.easeFactor;

        await review.save();

        return getCardReviewResponse(card, review);
    });
};

export const createReviewsService = async (email: string, cardIdList: string[]) =>
    Review.insertMany(
        cardIdList.map(
            (cardId) =>
                new Review({
                    card: cardId,
                    lastReview: new Date(),
                    nextReview: addDays(new Date(), 1),
                    easeFactor: 2.5,
                    views: 0,
                    user: email,
                })
        )
    );

export const createReviewService = async (email: string, cardId: string) => {
    if (await isCardReviewed(email, cardId)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "You already review this card");
    }

    const newReview = new Review({
        card: cardId,
        lastReview: new Date(),
        nextReview: addDays(new Date(), 1),
        easeFactor: 2.5,
        views: 0,
        user: email,
    });

    return newReview.save();
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
        views: review.views + 1,
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

const getNewEaseFactor = (easeFactor, quality) => easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

const getCardReviewResponse = (
    cardDocument: TCardDocument | LeanDocument<TCardDocument>,
    review: TReviewDocument | LeanDocument<TReviewDocument>
): TReviewResponse => ({
    id: cardDocument._id,
    user: review.user,
    deck: cardDocument.deck,
    toReview: false,
    type: cardDocument.type,
    back: cardDocument.back,
    front: cardDocument.front,
    example: cardDocument.example,
    referenceCard: cardDocument.referenceCard,
    easeFactor: review.easeFactor,
    lastReview: review.lastReview,
    nextReview: review.nextReview,
    views: review.views,
});
