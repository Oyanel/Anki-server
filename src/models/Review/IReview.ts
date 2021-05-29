import { Document, Types } from "mongoose";
import { ICardResponse } from "../Card/ICard";

export interface IReview {
    card: Types.ObjectId;
    lastReview: Date;
    nextReview: Date;
    easeFactor: Number;
    views: Number;
}

export type IReviewResponse = Omit<IReview, "card"> & ICardResponse;

export type TReviewDocument = IReview & Document;

export interface ICardReview {
    nextReview: Date;
    easeFactor: Number;
    views: Number;
}

export const CARD_REVIEW_LEVEL = {
    BLACKOUT: 0,
    FAILED: 1,
    CLOSE: 2,
    HARD: 3,
    MEDIUM: 4,
    EASY: 5,
};
