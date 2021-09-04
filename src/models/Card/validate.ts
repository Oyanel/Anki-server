import { ECardType } from "./ICard";

export const validateExample = (text: string) => {
    return text.length < 250;
};

export const validateType = (text: string) => {
    return Object.keys(ECardType).includes(text);
};
