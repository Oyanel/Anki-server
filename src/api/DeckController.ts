import { logError } from "../utils/error/error";
import { EHttpStatus, getCurrentUser, HttpError } from "../utils";
import {
    addCardService,
    createDeckService,
    deleteDeckService,
    getDeckService,
    searchDecksService,
    updateDeckService,
} from "../services/deckService";
import { validateDescription, validateName, validateTags } from "../models/Deck/validate";
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
import { ICardResponse, ICreateCard } from "../models/Card";
import { EDeckModelType, ICreateDeck, IDeckResponse, IDeckSummaryResponse, IQueryDeck } from "../models/Deck";
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
    @SuccessResponse(EHttpStatus.CREATED)
    async addCard(
        deckId: string,
        @Request() request: express.Request,
        @Body() card: ICreateCard
    ): Promise<ICardResponse[]> {
        if (!isValidObjectId(deckId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            const newCard = await addCardService(user.email, deckId, card);

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
    @SuccessResponse(EHttpStatus.CREATED)
    async createDeck(@Request() request: express.Request, @Body() deck: ICreateDeck): Promise<IDeckSummaryResponse> {
        const { description, name, tags } = deck;

        if (!validateName(name) || !validateDescription(description) || !validateTags(tags)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck invalid");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            const newDeck = await createDeckService(user.email, deck);
            this.setStatus(EHttpStatus.CREATED);

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
            const user = getCurrentUser(request.headers.authorization);
            await joinDeckService(user.email, deckId);
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
            const user = getCurrentUser(request.headers.authorization);
            await leaveDeckService(user.email, deckId);
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
            const user = getCurrentUser(request.headers.authorization);

            return await getDeckService(user.email, deckId, skip);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Put("{deckId}")
    @Response<HttpError>(EHttpStatus.NOT_FOUND)
    @Response<HttpError>(EHttpStatus.ACCESS_DENIED)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    async updateDeck(deckId: string, @Body() deck: ICreateDeck, @Request() request: express.Request): Promise<void> {
        const { name, description, isPrivate, tags } = deck;

        if (!isValidObjectId(deckId) || !validateTags(tags)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck id invalid");
        }

        if (!validateName(name) || !validateDescription(description)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck information invalid");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            await updateDeckService(user, deckId, name, description, isPrivate);
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
            const user = getCurrentUser(request.headers.authorization);
            await deleteDeckService(user.email, deckId);
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
        @Query() skip?: number,
        @Query() limit?: number,
        @Query() name?: string,
        @Query() from?: string,
        @Query() modelType?: EDeckModelType,
        @Query() tags?: string[],
        @Query() isPrivate?: boolean
    ): Promise<IDeckSummaryResponse[]> {
        try {
            const pagination: IPagination = { skip: skip ?? 0, limit: limit ?? 10 };
            const query: IQueryDeck = {
                from: from ? formatISO(parse(from, DATE_FORMAT, new Date())) : undefined,
                name,
                isPrivate,
                modelType,
                tags,
            };

            const user = getCurrentUser(request.headers.authorization);

            return await searchDecksService(user.email, query, pagination);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
