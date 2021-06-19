import { Document } from "mongoose";

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "cards": ["123d1"]
 * }
 */
export interface IDeck {
    name: String;
    description: String;
    isPrivate: boolean;
    cards: String[];
}

/**
 * @example {
 *     "id": "123d1",
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true
 * }
 */
export interface IDeckResponse extends IDeck {
    id: String;
}

export interface IQueryDeck {
    name?: string;
    from?: string;
    isPrivate?: boolean;
}

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true
 * }
 */
export interface ICreateDeck {
    name: string;
    description: string;
    isPrivate?: boolean;
}

export type TDeckDocument = IDeck & Document;
