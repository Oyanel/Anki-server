import { TCardDocument } from "../models/Card/ICard";
import { addDays, differenceInDays } from "date-fns";
import Card from "../models/Card";
import Review from "../models/Review";
import { EHttpStatus, HttpError } from "../utils";
import { LeanDocument, Types } from "mongoose";
import { isCardOwned } from "./deckService";
import { ICardReview, TReviewResponse, TReviewDocument } from "../models/Review/IReview";
import { TUserResponse } from "../models/authentication/User/IUser";

export const isCardReviewed = (userEmail: string, cardId: string) =>
    Review.countDocuments({ user: userEmail, card: cardId }).then((count) => count > 0);

export const removeReviewsService = async (user: TUserResponse, id: string) => {
    const cardDocument = await Card.findById(Types.ObjectId(id)).exec();

    if (await isCardOwned(user.profile.decks, id)) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "You cannot unreview a private card");
    }

    if (!cardDocument) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
    }

    await Review.find({ card: Types.ObjectId(id), user: { $ne: user.email } })
        .exec()
        .then(async (reviews) => {
            if (reviews.length === 0) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "No review found");
            }
            reviews.forEach((review) => review.deleteOne());
        });
};

export const reviewCardService = async (user: TUserResponse, id: string, reviewQuality: number) => {
    const promiseReview = Review.findOne({ card: Types.ObjectId(id), user: user.email.valueOf() }).exec();
    const promiseCard = Card.findById(Types.ObjectId(id)).exec();

    return await Promise.all([promiseCard, promiseReview]).then(async (response) => {
        const card = response[0];
        const review = response[1];

        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!(await isCardOwned(user.profile.decks, id))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }

        if (!card) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Card not found");
        }

        if (!review) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Review not found for this card");
        }

        const newCardReview = getNextReview(reviewQuality, review);
        review.nextReview = newCardReview.nextReview;
        review.lastReview = new Date();
        review.views = newCardReview.views;
        review.easeFactor = newCardReview.easeFactor;

        await review.save();

        return getCardReviewResponse(card, review);
    });
};

export const createReviewService = async (user: TUserResponse, cardId: string) => {
    if (!(await isCardOwned(user.profile.decks, cardId, true))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (await isCardReviewed(user.email.valueOf(), cardId)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "You already review this card");
    }

    const newReview = new Review({
        card: cardId,
        lastReview: new Date(),
        nextReview: addDays(new Date(), 1),
        easeFactor: 2.5,
        views: 0,
        user: user.email,
    });

    await newReview.save();
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

const getNewEaseFactor = (easeFactor, quality) => {
    return easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
};

const getCardReviewResponse = (
    cardDocument: TCardDocument | LeanDocument<TCardDocument>,
    review: TReviewDocument | LeanDocument<TReviewDocument>
) => {
    const cardReview: TReviewResponse = {
        id: cardDocument._id,
        user: review.user,
        deck: cardDocument.deck,
        back: cardDocument.back as String[],
        front: cardDocument.front as String[],
        example: cardDocument.example,
        isReversed: !!cardDocument.referenceCard,
        easeFactor: review.easeFactor,
        lastReview: review.lastReview,
        nextReview: review.nextReview,
        views: review.views,
    };

    return cardReview;
};
