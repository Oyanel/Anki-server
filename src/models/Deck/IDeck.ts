import { Document } from "mongoose";
import { ECardType, ICardResponse } from "../Card";
import { IPaginatedResponse } from "../../api/common/Pagination/IPagination";

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 *     "cards": ["123d1"],
 *     "defaultCardType": "TEXT",
 *     "defaultReviewReverseCard": false
 * }
 */
export interface IDeck {
    name: string;
    description: string;
    tags: string[];
    isPrivate: boolean;
    cards: string[];
    defaultCardType: ECardType;
    defaultReviewReverseCard: boolean;
}

/**
 * @example {
 *     "id": "123d1",
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 *     "isReviewed": true,
 *     "defaultCardType": "TEXT",
 *     "defaultReviewReverseCard": false
 * }
 */
export interface IDeckSummaryResponse extends Omit<IDeck, "cards"> {
    id: string;
    cards: number;
    isReviewed: boolean;
    isOwn: boolean;
}

/**
 * @example {
 *     "id": "123d1",
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 *     "isReviewed": true,
 *     "defaultCardType": "TEXT",
 *     "defaultReviewReverseCard": false,
 *     "cards": {
 *          "id": "123d1",
 *          "front": ["こんいしはあ"],
 *          "back": ["Bonjour"],
 *          "example": "こんにちはみなさん、げんきですか。",
 *          "isReversed": false
 *      }
 * }
 */
export interface IDeckResponse extends Omit<IDeckSummaryResponse, "cards"> {
    cards: IPaginatedResponse<ICardResponse[]>;
    isReviewed: boolean;
}

export interface IQueryDeck {
    name?: string;
    from?: string;
    tags?: string[];
    isReviewed?: boolean;
    isToReview?: boolean;
}

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 *     "defaultCardType": "TEXT",
 *     "defaultReviewReverseCard": false
 * }
 */
export interface ICreateDeck {
    name: string;
    description: string;
    tags: string[];
    isPrivate?: boolean;
    defaultCardType: ECardType;
    defaultReviewReverseCard: boolean;
}

/**
 * @example {
 *     "name": "Directions",
 *     "description": "How to give directions to someone",
 *     "isPrivate": true,
 *     "tags": ["Information", "Daily life"],
 *     "defaultCardType": "TEXT",
 *     "defaultReviewReverseCard": true
 * }
 */
export type TEditDeck = ICreateDeck;

export type TDeckDocument = IDeck & Document;
