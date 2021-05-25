// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Types, model, Schema } from "mongoose";
import { validateName, validateDescription } from "./validate";
import { TDeckDocument } from "./IDeck";
import Card from "../Card";
import User from "../authentication/User";

const DeckSchema = new Schema<TDeckDocument>(
    {
        name: {
            type: String,
            required: true,
            validate: { validator: validateName, msg: "Text is too long or incorrect" },
        },
        description: {
            type: String,
            validate: { validator: validateDescription, msg: "Text is incorrect" },
        },
        cards: {
            type: [Types.ObjectId],
        },
    },
    { timestamps: true }
);

DeckSchema.pre("remove", async function (next) {
    const cardPromise = Card.deleteOne({
        _id: {
            $in: this.cards,
        },
    }).exec();

    console.log({
        profile: {
            $pull: {
                decks: this._id,
            },
        },
    });

    const userPromise = User.update(
        {
            "profile.decks": {
                $in: this._id,
            },
        },
        {
            $pull: {
                "profile.decks": this._id,
            },
        }
    ).exec();

    await Promise.all([cardPromise, userPromise]);
    next();
});

export default model<TDeckDocument>("Deck", DeckSchema);
