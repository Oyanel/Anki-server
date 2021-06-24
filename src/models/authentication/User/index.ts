import { Schema, model, Types } from "mongoose";
import { validateEmail } from "./validate";
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
        },
        profile: {
            username: String,
            privateDecks: [Types.ObjectId],
            reviewedDecks: [Types.ObjectId],
        },
    },
    { timestamps: true }
);

export default model<TUserDocument>("User", UserSchema);

export * from "./IUser";
