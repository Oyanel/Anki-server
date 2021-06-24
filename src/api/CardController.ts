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
import { IReviewLevel, TReviewResponse } from "../models/Review/IReview";
import { reviewCardService } from "../services/reviewService";

@Route("cards")
@Tags("Card")
@Security("Authorization")
@Response<HttpError>(EHttpStatus.BAD_REQUEST)
@Response<HttpError>(EHttpStatus.INTERNAL_ERROR)
export class CardController extends Controller {
    @Get()
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

            return await searchCardsService(user.email, paginatedCardQuery);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Get("{cardId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    public async getCard(cardId: string, @Request() request: express.Request): Promise<ICardResponse> {
        if (!isValidObjectId(cardId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);

            return await getCardService(user.email, cardId);
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
            await updateCardService(user.email, cardId, front, back, example);
            this.setStatus(EHttpStatus.NO_CONTENT);

            return;
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
            await deleteCardService(user.email, cardId);
            this.setStatus(EHttpStatus.NO_CONTENT);

            return;
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
        const { reviewLevel } = body;

        try {
            const user = getCurrentUser(request.headers.authorization);

            return await reviewCardService(user.email, cardId, reviewLevel);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
