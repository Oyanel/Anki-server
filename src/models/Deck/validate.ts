import { textRegex } from "../../utils/validation/regex";
import { EDeckModelType } from "./IDeck";

export const validateName = (text: string) => {
    return textRegex.test(text) && text.length <= 50;
};

export const validateDescription = (text: string) => {
    return textRegex.test(text);
};

export const validateModelType = (modelType: string) => {
    return EDeckModelType[modelType] !== undefined;
};

export const validateTags = (tags: string[]) => {
    return tags.every((tag) => tag.length <= 20 && textRegex.test(tag));
};
