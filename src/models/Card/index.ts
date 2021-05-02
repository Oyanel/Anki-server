import { Schema, model, Types } from "mongoose";
import { TCardDocument } from "./ICard";
import Deck from "../Deck";

const CardSchema = new Schema<TCardDocument>({
    front: {
        type: [String],
        required: true,
    },
    back: {
        type: [String],
        required: true,
    },
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
});

CardSchema.pre("remove", async function (next) {
    await Deck.updateOne({ cards: { $in: [this._id] } }, { $pull: { cards: this._id } })
        .lean()
        .exec();
    next();
});

export default model<TCardDocument>("Card", CardSchema);
