/* eslint-disable @typescript-eslint/no-explicit-any */
import { DATE_FORMAT, EHttpStatus, HttpError } from "../utils";
import { Request } from "express";
import { IQueryCard } from "../models/Card/ICard";
import { IQueryDeck } from "../models/Deck/IDeck";
import { formatISO, parse } from "date-fns";

export const sanitizeCardUpdateRequest = (request: Request) => {
    try {
        const frontRequest = request.body.front;
        const backRequest = request.body.back;
        const reverseCardRequest = request.body.reverseCard;

        const front = frontRequest.map((frontItem) => String(frontItem));
        const back = backRequest.map((backItem) => String(backItem));
        const reverseCard = Boolean(reverseCardRequest);

        return {
            front,
            back,
            reverseCard,
        };
    } catch (error) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad request");
    }
};

export const sanitizeDeckRequest = (request: Request) => {
    try {
        let isPrivate;
        const nameRequest = request.body.name;
        const descriptionRequest = request.body.description;

        const name = nameRequest && String(nameRequest);
        const description = descriptionRequest && String(descriptionRequest);

        if (request.query.private !== undefined) {
            isPrivate = request.query.private !== "false";
        }

        return {
            name,
            description,
            isPrivate,
        };
    } catch (error) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The name/description fields are not strings");
    }
};

export const sanitizeCardQueryRequest = (request: Request) => {
    try {
        const name = request.query.name && String(request.query.name);
        let toReview, reverse;

        if (request.query.toReview !== undefined) {
            toReview = request.query.toReview !== "false";
        }

        if (request.query.reverse !== undefined) {
            reverse = request.query.reverse !== "false";
        }

        const query: IQueryCard = {
            name,
            toReview,
            reverse,
        };

        return query;
    } catch (error) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The query is malformed");
    }
};

export const sanitizeDeckQueryRequest = (request: Request) => {
    try {
        const name = request.query.name && String(request.query.name);
        const createdAt = request.query.createdAt && String(request.query.createdAt);

        const query: IQueryDeck = {
            name,
            from: createdAt ? formatISO(parse(createdAt, DATE_FORMAT, new Date())) : undefined,
        };

        return query;
    } catch (error) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The query is malformed");
    }
};
