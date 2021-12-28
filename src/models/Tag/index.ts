import { Schema, model } from "mongoose";
import { TTagDocument } from "./ITag";
import { validateTag } from "../Deck/validate";

const TagSchema = new Schema<TTagDocument>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    tag: {
        type: String,
        required: true,
        unique: true,
        validate: { validator: validateTag, msg: "Invalid tag" },
    },
});

export default model<TTagDocument>("Tag", TagSchema);

export * from "./ITag";
