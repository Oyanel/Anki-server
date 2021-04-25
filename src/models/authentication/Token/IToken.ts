import { Document } from "mongoose";

export interface IToken {
    user: String;
    accessToken: String;
    accessTokenExpiresAt: Date;
    refreshToken: String;
    refreshTokenExpiresAt: Date;
}

export type TTokenDocument = IToken & Document;
