import { Document } from "mongoose";
import { ICardResponse } from "../Card";

export interface IReview {
    card: String;
    user: string;
    isReverse: boolean;
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

export enum ECardReviewLevel {
    BLACKOUT,
    FAILED,
    CLOSE,
    HARD,
    MEDIUM,
    EASY,
}

export enum ECardReviewName {
    BLACKOUT = "BLACKOUT",
    FAILED = "FAILED",
    CLOSE = "CLOSE",
    HARD = "HARD",
    MEDIUM = "MEDIUM",
    EASY = "EASY",
}

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
 *     "reviewLevel": "EASY",
 *     "isReverseReview": false
 * }
 */
export interface IReviewAction {
    isReverseReview: boolean;
    reviewLevel: ECardReviewName;
}
