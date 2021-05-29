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
    referenceCard: {
        type: Types.ObjectId,
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
    },
});

export default model<TReviewDocument>("Review", ReviewSchema);
