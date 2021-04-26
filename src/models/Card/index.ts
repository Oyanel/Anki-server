import { Schema, model } from "mongoose";
import { TCardDocument } from "./ICard";
import { validateBack, validateFront } from "./validate";

const CardSchema = new Schema<TCardDocument>({
    front: {
        type: String,
        required: true,
        validate: { validator: validateFront },
    },
    back: {
        type: String,
        required: true,
        validate: { validator: validateBack },
    },
    lastReview: {
        type: Date,
        required: true,
    },
    nextReview: {
        type: Date,
        required: true,
    },
    views: {
        type: Number,
        required: true,
    },
});

export default model<TCardDocument>("Card", CardSchema);
