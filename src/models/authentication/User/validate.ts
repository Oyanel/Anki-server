import { isEmail } from "validator";

export const validateUsername = (username: string) => {
    return isEmail(username);
};
