import { Types, model, Schema } from "mongoose";
import { validateName, validateDescription, validateModelType, validateTags } from "./validate";
import { TDeckDocument } from "./IDeck";
import Card from "../Review";
import User from "../authentication/User";

const DeckSchema = new Schema<TDeckDocument>(
    {
        name: {
            type: String,
            required: true,
            validate: { validator: validateName, msg: "Name is incorrect" },
        },
        description: {
            type: String,
            validate: { validator: validateDescription, msg: "Description is incorrect" },
        },
        cards: {
            type: [Types.ObjectId],
            required: true,
        },
        modelType: {
            type: String,
            required: true,
            validate: { validator: validateModelType, msg: "The deck model type doesn't exists" },
        },
        tags: {
            type: [String],
            validate: { validator: validateTags, msg: "Tags are incorrect" },
        },
        isPrivate: {
            type: Boolean,
            required: true,
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

    const userPromise = User.updateMany(
        {},
        {
            $pull: {
                "profile.privateDecks": this._id,
                "profile.reviewedDecks": this._id,
            },
        }
    ).exec();

    await Promise.all([cardPromise, userPromise]);
    next();
});

export default model<TDeckDocument>("Deck", DeckSchema);

export * from "./IDeck";
