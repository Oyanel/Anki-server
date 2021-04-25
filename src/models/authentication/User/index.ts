import { Schema, model } from "mongoose";
import { validateUsername } from "./validate";
import { TUserDocument } from "./IUser";

const UserSchema = new Schema<TUserDocument>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            validate: { validator: validateUsername, msg: "Invalid username" },
        },
        password: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default model<TUserDocument>("User", UserSchema);
