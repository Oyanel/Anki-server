/* eslint-disable @typescript-eslint/no-explicit-any */
import { EHttpStatus, HttpError } from "../utils";

export const sanitizeCardRequest = (frontRequest: any, backRequest: any) => {
    try {
        const front = frontRequest.map((frontItem) => String(frontItem));
        const back = backRequest.map((backItem) => String(backItem));

        return {
            front,
            back,
        };
    } catch (error) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The front/back fields are not string arrays");
    }
};

export const sanitizeDeckRequest = (nameRequest: any, descriptionRequest: any) => {
    try {
        const name = String(nameRequest);
        const description = String(descriptionRequest);

        return {
            name,
            description,
        };
    } catch (error) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The name/description fields are not strings");
    }
};
