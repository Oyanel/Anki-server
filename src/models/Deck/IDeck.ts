import { Document } from "mongoose";
import { ICardResponse } from "../Card";

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 *     "cards": ["123d1"]
 * }
 */
export interface IDeck {
    name: string;
    description: string;
    tags: string[];
    isPrivate: boolean;
    cards: string[];
}

/**
 * @example {
 *     "id": "123d1",
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 * }
 */
export interface IDeckSummaryResponse extends IDeck {
    id: string;
}

/**
 * @example {
 *     "id": "123d1",
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 *     "cards": {
 *          "id": "123d1",
 *          "front": ["こんいしはあ"],
 *          "back": ["Bonjour"],
 *          "example": "こんにちはみなさん、げんきですか。"
 *          "isReversed": false
 *      }
 * }
 */
export interface IDeckResponse extends Omit<IDeckSummaryResponse, "cards"> {
    cards: ICardResponse[];
}

export interface IQueryDeck {
    name?: string;
    from?: string;
    tags?: string[];
    isPrivate?: boolean;
}

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 * }
 */
export interface ICreateDeck {
    name: string;
    description: string;
    tags: string[];
    isPrivate?: boolean;
}

export type TDeckDocument = IDeck & Document;
