import { Schema, model, Types } from "mongoose";
import { TReviewDocument } from "./IReview";

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
        unique: true,
    },
});

export default model<TReviewDocument>("Review", ReviewSchema);
