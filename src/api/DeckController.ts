import { logError } from "../utils/error/error";
import { EHttpStatus, getCurrentUserEmail, HttpError } from "../utils";
import {
    addCardService,
    createDeckService,
    deleteDeckService,
    getDeckService,
    searchDecksService,
    updateDeckService,
} from "../services/deckService";
import { validateCardType, validateDescription, validateName, validateTags } from "../models/Deck/validate";
import { isValidObjectId } from "mongoose";
import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Path,
    Put,
    Query,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";
import express from "express";
import { ICard, ICreateCard } from "../models/Card";
import { ICreateDeck, IDeckResponse, IDeckSummaryResponse, IEditDeck, IQueryDeck } from "../models/Deck";
import { IPagination } from "./common/Pagination/IPagination";
import { formatISO, parse } from "date-fns";
import { joinDeckService, leaveDeckService } from "../services/userService";
import { DATE_FORMAT } from "../constant";

@Route("decks")
@Tags("Deck")
@Security("Authorization")
@Response<HttpError>(EHttpStatus.BAD_REQUEST)
@Response<HttpError>(EHttpStatus.INTERNAL_ERROR)
export class DeckController extends Controller {
    @Post("{deckId}/add")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    async addCard(deckId: string, @Request() request: express.Request, @Body() card: ICreateCard): Promise<ICard> {
        if (!isValidObjectId(deckId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid");
        }

        try {
            const email = getCurrentUserEmail(request.headers.authorization);
            const newCard = await addCardService(email, deckId, card);

            this.setStatus(EHttpStatus.CREATED);

            return newCard;
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post()
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.OK)
    async createDeck(@Request() request: express.Request, @Body() deck: ICreateDeck): Promise<IDeckSummaryResponse> {
        const { description, name, tags, defaultCardType } = deck;

        if (
            !validateName(name) ||
            !validateDescription(description) ||
            !validateTags(tags) ||
            !validateCardType(defaultCardType)
        ) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck invalid");
        }

        try {
            const email = getCurrentUserEmail(request.headers.authorization);
            const newDeck = await createDeckService(email, deck);
            this.setStatus(EHttpStatus.CREATED);

            this.setStatus(200);

            return newDeck;
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post("{deckId}/join")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.CREATED)
    async joinDeck(@Request() request: express.Request, @Path() deckId: string): Promise<void> {
        if (!isValidObjectId(deckId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid");
        }

        try {
            const email = getCurrentUserEmail(request.headers.authorization);
            await joinDeckService(email, deckId);
            this.setStatus(EHttpStatus.CREATED);

            return;
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Delete("{deckId}/leave")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async leaveDeck(@Request() request: express.Request, @Path() deckId: string): Promise<void> {
        if (!isValidObjectId(deckId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid");
        }

        try {
            const email = getCurrentUserEmail(request.headers.authorization);
            await leaveDeckService(email, deckId);
            this.setStatus(EHttpStatus.CREATED);

            return;
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Get("{deckId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    async getDeck(
        @Request() request: express.Request,
        @Path() deckId: string,
        @Query() skip: number
    ): Promise<IDeckResponse> {
        if (!isValidObjectId(deckId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            const email = getCurrentUserEmail(request.headers.authorization);

            return await getDeckService(email, deckId, skip);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Put("{deckId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async updateDeck(deckId: string, @Body() deck: IEditDeck, @Request() request: express.Request): Promise<void> {
        const { name, description, tags, defaultCardType } = deck;

        if (!isValidObjectId(deckId) || !validateTags(tags) || !validateCardType(defaultCardType)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck invalid");
        }

        if (!validateName(name) || !validateDescription(description)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck information invalid");
        }

        try {
            const email = getCurrentUserEmail(request.headers.authorization);
            await updateDeckService(email, deckId, deck);
            this.setStatus(EHttpStatus.NO_CONTENT);

            return;
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Delete("{deckId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async deleteDeck(deckId: string, @Request() request: express.Request): Promise<void> {
        if (!isValidObjectId(deckId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            const email = getCurrentUserEmail(request.headers.authorization);
            await deleteDeckService(email, deckId);
            this.setStatus(EHttpStatus.NO_CONTENT);

            return;
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Get()
    async searchDecks(
        @Request() request: express.Request,
        @Query() isReviewed: boolean,
        @Query() skip?: number,
        @Query() limit?: number,
        @Query() name?: string,
        @Query() from?: string,
        @Query() tags?: string[],
        @Query() isToReview?: boolean
    ): Promise<IDeckSummaryResponse[]> {
        try {
            const pagination: IPagination = { skip: skip ?? 0, limit: limit ?? 10 };
            const query: IQueryDeck = {
                from: from ? formatISO(parse(from, DATE_FORMAT, new Date())) : undefined,
                name,
                isReviewed,
                tags,
                isToReview,
            };

            const email = getCurrentUserEmail(request.headers.authorization);

            return await searchDecksService(email, query, pagination);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
