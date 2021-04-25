import { Document } from "mongoose";

export interface IUser {
    username: String;
    password: String;
}

export type TUserDocument = IUser & Document;
