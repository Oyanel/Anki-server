/* eslint-disable @typescript-eslint/no-explicit-any */
import { EHttpStatus, HttpError } from "../utils";
import { Request } from "express";
import { IQueryCard } from "../models/Card/ICard";

export const sanitizeCardUpdateRequest = (request: Request) => {
    try {
        const frontRequest = request.body.front;
        const backRequest = request.body.back;

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

export const sanitizeCardQueryRequest = (request: Request) => {
    try {
        const name = request.query.name && String(request.query.name);
        let toReview;

        if (request.query.toReview !== undefined) {
            toReview = request.query.toReview !== "false";
        }

        const query: IQueryCard = {
            name,
            toReview,
        };

        return query;
    } catch (error) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The query is malformed");
    }
};
