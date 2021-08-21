import { Schema, model } from "mongoose";
import { TOtpDocument } from "./IOtp";

const TokenSchema = new Schema<TOtpDocument>({
    user: { type: String, required: true, unique: true },
    code: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
});

export default model<TOtpDocument>("Otp", TokenSchema);

export * from "./IOtp";
