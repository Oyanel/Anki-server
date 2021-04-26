import { Schema, model } from "mongoose";
import { TCardDocument } from "./ICard";
import { validateBack, validateFront } from "./validate";
import Deck from "../Deck";

const CardSchema = new Schema<TCardDocument>({
    front: {
        type: String,
        required: true,
        validate: { validator: validateFront, msg: "Not japanese chars" },
    },
    back: {
        type: String,
        required: true,
        validate: { validator: validateBack, msg: "Not regular text" },
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

CardSchema.pre("remove", async function (next) {
    const test = await Deck.findOne({ cards: { $in: [this._id] } })
        .lean()
        .exec();

    console.log(test);
    // await Deck.updateOne({ cards: { $in: [this._id] } }, { $pull: { cards: this._id } })
    //     .lean()
    //     .exec();
    next();
});

export default model<TCardDocument>("Card", CardSchema);
