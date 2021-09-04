import { textRegex } from "../../utils/validation/regex";

export const validateName = (text: string) => {
    return textRegex.test(text) && text.length <= 50;
};

export const validateDescription = (text: string) => {
    return textRegex.test(text);
};

export const validateTags = (tags: string[]) => {
    return tags.every((tag) => tag.length <= 20 && textRegex.test(tag));
};
