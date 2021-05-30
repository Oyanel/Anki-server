import { Schema, model, Types } from "mongoose";
import { TReviewDocument } from "./IReview";
import { validateEmail } from "../authentication/User/validate";

const ReviewSchema = new Schema<TReviewDocument>({
    lastReview: {
        type: Date,
        required: true,
    },
    nextReview: {
        type: Date,
        required: true,
    },
    easeFactor: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        required: true,
    },
    card: {
        type: Types.ObjectId,
        required: true,
    },
    user: {
        type: String,
        required: true,
        validate: { validator: validateEmail, msg: "Invalid email" },
    },
});

export default model<TReviewDocument>("Review", ReviewSchema);
