import { Document } from "mongoose";

export interface IDeck {
    name: String;
    description: String;
    cards: String[];
}

export interface IDeckResponse extends IDeck {
    id: String;
}

export interface IQueryDeck {
    name?: string;
    from?: string;
}

export type TDeckDocument = IDeck & Document;
