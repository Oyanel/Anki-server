import { Document } from "mongoose";

export interface ICard {
    deck: String;
    front: String[];
    back: String[];
    referenceCard?: String;
}

export interface ICardResponse extends Omit<ICard, "referenceCard"> {
    id: String;
    isReversed: boolean;
}

export type TCardDocument = ICard & Document;

export interface IQueryCard {
    name?: string;
    toReview?: boolean;
    decks?: string[];
    reverse?: boolean;
}
