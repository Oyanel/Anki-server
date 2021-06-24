import { Schema, model } from "mongoose";
import { TTokenDocument } from "./IToken";

const TokenSchema = new Schema<TTokenDocument>({
    accessToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true },
    refreshToken: { type: String, required: true },
    refreshTokenExpiresAt: { type: Date, required: true },
    user: { type: String, required: true, unique: true },
});

export default model<TTokenDocument>("Token", TokenSchema);

export * from "./IToken";
