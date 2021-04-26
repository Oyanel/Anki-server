import { Document } from "mongoose";

export interface ICard {
    front: String;
    back: String;
    lastReview: Date;
    nextReview: Date;
    views: Number;
}

export interface ICardResponse extends ICard {
    id: String;
}

export type TCardDocument = ICard & Document;
