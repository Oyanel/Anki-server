import { Document, Types } from "mongoose";
import { ICardResponse } from "../Card/ICard";

export interface IReview {
    card: Types.ObjectId;
    user: String;
    lastReview: Date;
    nextReview: Date;
    easeFactor: number;
    views: number;
}

export type TReviewResponse = Omit<IReview, "card"> & ICardResponse;

export type TReviewDocument = IReview & Document;

export interface ICardReview {
    nextReview: Date;
    easeFactor: number;
    views: number;
}

export const CARD_REVIEW_LEVEL = {
    BLACKOUT: 0,
    FAILED: 1,
    CLOSE: 2,
    HARD: 3,
    MEDIUM: 4,
    EASY: 5,
};

/**
 * @enum {
 *     "BLACKOUT",
 *     "FAILED",
 *     "CLOSE",
 *     "HARD",
 *     "MEDIUM",
 *     "EASY"
 *  }
 * @example {
 *     "reviewLevel": "EASY"
 * }
 */
export interface IReviewLevel {
    reviewLevel: string;
}
