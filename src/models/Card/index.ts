import { Schema, model, Types } from "mongoose";
import { TCardDocument } from "./ICard";
import Deck from "../Deck";
import Review from "../Review";

const CardSchema = new Schema<TCardDocument>({
    deck: {
        type: Types.ObjectId,
        required: true,
    },
    front: {
        type: [String],
        required: true,
    },
    back: {
        type: [String],
        required: true,
    },
});

CardSchema.pre("remove", async function (next) {
    const promiseReview = Review.deleteOne({ card: this._id }).lean().exec();

    const promiseDeck = Deck.updateOne({ cards: { $in: [this._id] } }, { $pull: { cards: this._id } })
        .lean()
        .exec();

    await Promise.all([promiseDeck, promiseReview]);
    next();
});

export default model<TCardDocument>("Card", CardSchema);
