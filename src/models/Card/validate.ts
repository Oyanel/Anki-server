import { japaneseRegex, textRegex } from "../../utils/validation/regex";

export const validateFront = (texts: [String]) => texts.map((text) => japaneseRegex.test(text.valueOf()));

export const validateBack = (texts: [String]) => texts.map((text) => textRegex.test(text.valueOf()));
