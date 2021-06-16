import { deleteCardService, getCardService, searchCardsService, updateCardService } from "../services/cardService";
import { logError } from "../utils/error/error";
import { EHttpStatus, getCurrentUser, HttpError } from "../utils";
import { isValidObjectId } from "mongoose";
import {
    Controller,
    Get,
    Request,
    Response,
    Route,
    Security,
    Tags,
    Query,
    Put,
    SuccessResponse,
    Delete,
    Post,
    Body,
} from "tsoa";
import { ICardResponse, IQueryCard } from "../models/Card/ICard";
import { IPaginatedQuery } from "./common/Pagination/IPagination";
import express from "express";
import { CARD_REVIEW_LEVEL, IReviewLevel, TReviewResponse } from "../models/Review/IReview";
import { createReviewService, removeReviewsService, reviewCardService } from "../services/reviewService";

@Route("cards")
@Tags("Card")
@Security("Authorization")
@Response<HttpError>(EHttpStatus.BAD_REQUEST)
@Response<HttpError>(EHttpStatus.INTERNAL_ERROR)
export class CardController extends Controller {
    @Get("{cardId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    public async getCard(cardId: string, @Request() request: express.Request): Promise<ICardResponse> {
        console.log("Hello !");
        if (!isValidObjectId(cardId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);

            return await getCardService(user.profile.decks, cardId);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Get("search")
    public async searchCards(
        @Request() request: express.Request,
        @Query() skip?: number,
        @Query() limit?: number,
        @Query() toReview?: boolean,
        @Query() reverse?: boolean,
        @Query() name?: string
    ): Promise<ICardResponse[]> {
        try {
            const user = getCurrentUser(request.headers.authorization);
            const paginatedCardQuery: IPaginatedQuery<IQueryCard> = {
                skip: skip ?? 0,
                limit: limit ?? 10,
                reverse,
                toReview,
                name,
            };

            return await searchCardsService(user.profile.decks, paginatedCardQuery);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Put("{cardId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async updateCard(
        cardId: string,
        @Request() request: express.Request,
        @Query() front: string[],
        @Query() back: string[],
        @Query() example: string
    ): Promise<void> {
        if (!isValidObjectId(cardId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Card id invalid");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            await updateCardService(user.profile.decks, cardId, front, back, example);

            this.setStatus(EHttpStatus.NO_CONTENT);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Delete("{cardId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async deleteCard(cardId: string, @Request() request: express.Request): Promise<void> {
        if (!isValidObjectId(cardId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Card id invalid");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            await deleteCardService(user.profile.decks, cardId);
            this.setStatus(EHttpStatus.NO_CONTENT);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post("{cardId}/review")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async reviewCard(
        cardId: string,
        @Body() body: IReviewLevel,
        @Request() request: express.Request
    ): Promise<TReviewResponse> {
        const reviewLevel = CARD_REVIEW_LEVEL[body.reviewLevel];

        if (reviewLevel === undefined || !isValidObjectId(cardId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }
        try {
            const user = getCurrentUser(request.headers.authorization);

            return await reviewCardService(user, cardId, reviewLevel);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post("{cardId}/join")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async createReviewCard(cardId: string, @Request() request: express.Request) {
        if (!isValidObjectId(cardId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            await createReviewService(user, cardId);
            this.setStatus(EHttpStatus.NO_CONTENT);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Delete("{cardId}/unreview")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async unreviewCard(cardId: string, @Request() request: express.Request) {
        if (!isValidObjectId(cardId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            await removeReviewsService(user, cardId);
            this.setStatus(EHttpStatus.NO_CONTENT);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
