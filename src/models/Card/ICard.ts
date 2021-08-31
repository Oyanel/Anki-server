import { Document } from "mongoose";

export interface ICard {
    deck: string;
    front: string[];
    back: string[];
    example: string;
    referenceCard?: string;
}

/**
 * @example {
 *     "id": "123d1",
 *     "front": ["こんいしはあ"],
 *     "back": ["Bonjour"],
 *     "example": "こんにちはみなさん、げんきですか。"
 *     "referenceCard": 123
 * }
 */
export interface ICardResponse extends ICard {
    id: string;
    toReview?: boolean;
}

export type TCardDocument = ICard & Document;

export interface IQueryCard {
    ids?: string[];
    name?: string;
    toReview?: boolean;
    reverse?: boolean;
    deck?: string;
}

/**
 * @example {
 *     "front": ["こんいしは"],
 *     "back": ["Bonjour"],
 *     "example": "こんにちはみなさん、げんきですか。",
 *     "reverseCard": true
 * }
 */
export interface ICreateCard {
    front: string[];
    back: string[];
    reverseCard?: boolean;
    example?: string;
}
