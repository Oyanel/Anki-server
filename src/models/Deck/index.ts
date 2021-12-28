import { model, Schema, Types } from "mongoose";
import { validateCardType, validateDescription, validateName, validateTags } from "./validate";
import { TDeckDocument } from "./IDeck";
import Card from "../Card";
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
        tags: {
            type: [String],
            validate: { validator: validateTags, msg: "Tags are incorrect" },
        },
        isPrivate: {
            type: Boolean,
            required: true,
        },
        defaultCardType: {
            type: String,
            required: true,
            validate: { validator: validateCardType, msg: "Not a valid card type" },
        },
        defaultReviewReverseCard: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

DeckSchema.pre("remove", async function (next) {
    const cardPromise = Card.find({
        deck: this._id,
    })
        .exec()
        .then(async (cardDocuments) => cardDocuments.map((cardDocument) => cardDocument.remove()));

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
