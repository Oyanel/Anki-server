import { Schema, model, Types } from "mongoose";
import { validateEmail, validatePassword } from "./validate";
import { TUserDocument } from "./IUser";

const UserSchema = new Schema<TUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            validate: { validator: validateEmail, msg: "Invalid email" },
        },
        password: {
            type: String,
            required: true,
            validate: { validator: validatePassword, msg: "Invalid password" },
        },
        profile: {
            username: String,
            privateDecks: [Types.ObjectId],
            reviewedDecks: [Types.ObjectId],
            language: String,
        },
    },
    { timestamps: true }
);

export default model<TUserDocument>("User", UserSchema);

export * from "./IUser";
