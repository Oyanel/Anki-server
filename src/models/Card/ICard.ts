import { Document } from "mongoose";

export enum ECardType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
}

export interface ICard {
    deck: String;
    front: string[];
    back: string[];
    example: string;
    type: ECardType;
    isReverse: boolean;
}

/**
 * @example {
 *     "id": "123d1",
 *     "front": ["こんいしはあ"],
 *     "back": ["Bonjour"],
 *     "example": "こんにちはみなさん、げんきですか。",
 *     "toReview": "true",
 *     "reverseToReview": "false",
 *     "type": "TEXT"
 * }
 */
export interface ICardResponse extends ICard {
    id: string;
    toReview?: boolean;
    reverseToReview?: boolean;
}

export type TCardDocument = ICard & Document;

export interface IQueryCard {
    ids?: string[];
    name?: string;
    toReview?: boolean;
    deck?: string;
}

/**
 * @example {
 *     "front": ["こんいしは"],
 *     "back": ["Bonjour"],
 *     "type": "TEXT",
 *     "example": "こんにちはみなさん、げんきですか。",
 *     "reverseCard": true
 * }
 */
export interface ICreateCard {
    front: string[];
    back: string[];
    type: ECardType;
    reverseCard?: boolean;
    example?: string;
}

/**
 * @example {
 *     "front": ["こんいしは"],
 *     "back": ["Bonjour"],
 *     "example": "こんにちはみなさん、げんきですか。",
 * }
 */
export interface IEditCard {
    front: string[];
    back: string[];
    example?: string;
}
