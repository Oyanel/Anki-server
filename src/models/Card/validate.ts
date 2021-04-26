import { japaneseRegex, textRegex } from "../../utils/validation/regex";

export const validateFront = (text: string) => {
    return japaneseRegex.test(text);
};

export const validateBack = (text: string) => {
    return textRegex.test(text);
};
