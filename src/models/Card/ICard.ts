import { Document } from "mongoose";

export interface ICard {
    front: String;
    back: String;
    lastReview: Date;
    nextReview: Date;
    easeFactor: Number;
    views: Number;
}

export interface ICardResponse extends Omit<ICard, "easeFactor"> {
    id: String;
}

export type TCardDocument = ICard & Document;

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
