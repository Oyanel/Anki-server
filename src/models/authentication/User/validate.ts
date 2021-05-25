import { isEmail } from "validator";
import { textRegex } from "../../../utils/validation/regex";

export const validateEmail = (email: string) => {
    return isEmail(email);
};

export const validateUsername = (text: string) => {
    return textRegex.test(text) && text.length <= 50;
};
