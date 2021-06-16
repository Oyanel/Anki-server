import { Document } from "mongoose";

export interface ICard {
    deck: String;
    front: String[];
    back: String[];
    example: String;
    referenceCard?: String;
}

/**
 * @example {
 *     "id": "123d1",
 *     "front": ["こんいしはあ"],
 *     "back": ["Bonjour"],
 *     "example": "こんにちはみなさん、げんきですか。"
 *     "isReversed": false
 * }
 */
export interface ICardResponse extends Omit<ICard, "referenceCard"> {
    id: String;
    isReversed: boolean;
}

export type TCardDocument = ICard & Document;

export interface IQueryCard {
    name?: string;
    toReview?: boolean;
    reverse?: boolean;
}

/**
 * @example {
 *     "deck": "123",
 *     "front": ["こんいしは"],
 *     "back": ["Bonjour"],
 *     "example": "こんにちはみなさん、げんきですか。",
 *     "reverseCard": true
 * }
 */
export interface ICreateCard {
    deck: String;
    front: String[];
    back: String[];
    reverseCard?: boolean;
    example?: String;
}
