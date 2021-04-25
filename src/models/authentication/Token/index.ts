import { Schema, model } from "mongoose";
import { TTokenDocument } from "./IToken";

const TokenSchema = new Schema<TTokenDocument>({
    accessToken: String,
    accessTokenExpiresAt: Date,
    refreshToken: String,
    refreshTokenExpiresAt: Date,
    user: { type: String, required: true },
});

export default model<TTokenDocument>("Token", TokenSchema);
