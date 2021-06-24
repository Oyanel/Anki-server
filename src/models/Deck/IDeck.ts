import { Document } from "mongoose";

export enum EDeckModelType {
    BASIC = "BASIC",
    KANJI = "KANJI",
    COMMON = "COMMON",
}

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "modelType": "BASIC",
 *     "tags": ["Information", "Daily life"],
 *     "cards": ["123d1"]
 * }
 */
export interface IDeck {
    name: string;
    description: string;
    modelType: EDeckModelType;
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
 *     "modelType": "BASIC",
 *     "tags": ["Information", "Daily life"],
 * }
 */
export interface IDeckResponse extends IDeck {
    id: string;
}

export interface IQueryDeck {
    name?: string;
    from?: string;
    tags?: string[];
    modelType?: EDeckModelType;
    isPrivate?: boolean;
}

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "modelType": "BASIC",
 *     "tags": ["Information", "Daily life"],
 * }
 */
export interface ICreateDeck {
    name: string;
    modelType: EDeckModelType;
    description: string;
    tags: string[];
    isPrivate?: boolean;
}

export type TDeckDocument = IDeck & Document;
