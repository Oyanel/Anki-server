import { Types, model, Schema } from "mongoose";
import { validateName, validateDescription } from "./validate";
import { TDeckDocument } from "./IDeck";
import Card from "../Card";

const DeckSchema = new Schema<TDeckDocument>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
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
    await Card.remove({
        _id: {
            $in: this.cards,
        },
    }).exec();
    next();
});

export default model<TDeckDocument>("Deck", DeckSchema);
