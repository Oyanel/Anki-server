import { Document } from "mongoose";

export interface IToken {
    user: string;
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
}

export type TTokenDocument = IToken & Document;
