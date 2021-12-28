import { Document } from "mongoose";

export interface ITag {
    tag: String;
}

export type TTagDocument = ITag & Document;
