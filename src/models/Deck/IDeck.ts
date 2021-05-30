import { Document } from "mongoose";

export interface IDeck {
    name: String;
    description: String;
    private: Boolean;
    cards: String[];
}

export interface IDeckResponse extends IDeck {
    id: String;
}

export interface IQueryDeck {
    name?: string;
    from?: string;
    private?: boolean;
}

export type TDeckDocument = IDeck & Document;
