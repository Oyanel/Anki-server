import { logError } from "../utils/error/error";
import { DATE_FORMAT, EHttpStatus, getCurrentUser, HttpError } from "../utils";
import {
    addCardService,
    createDeckService,
    deleteDeckService,
    getDeckService,
    searchDecksService,
    updateDeckService,
} from "../services/deckService";
import { validateDescription, validateName } from "../models/Deck/validate";
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
import { ICardResponse, ICreateCard } from "../models/Card/ICard";
import { ICreateDeck, IDeckResponse, IQueryDeck } from "../models/Deck/IDeck";
import { IPagination } from "./common/Pagination/IPagination";
import { formatISO, parse } from "date-fns";
import { joinDeckService, leaveDeckService } from "../services/userService";

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
            const newCard = await addCardService(user.email.valueOf(), deckId, card);

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
    async createDeck(@Request() request: express.Request, @Body() deck: ICreateDeck): Promise<IDeckResponse> {
        const { description, name } = deck;

        if (!validateName(name) || !validateDescription(description)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Deck invalid");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);
            const newDeck = await createDeckService(user.email.valueOf(), deck);
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
            await joinDeckService(user.email.valueOf(), deckId);
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
            await leaveDeckService(user.email.valueOf(), deckId);
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
    async getDeck(deckId: string, @Request() request: express.Request): Promise<IDeckResponse> {
        if (!isValidObjectId(deckId)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            const user = getCurrentUser(request.headers.authorization);

            return await getDeckService(user.email.valueOf(), deckId);
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
        const { name, description, isPrivate } = deck;

        if (!isValidObjectId(deckId)) {
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
            await deleteDeckService(user.email.valueOf(), deckId);
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
        @Query() isPrivate?: boolean
    ): Promise<IDeckResponse[]> {
        try {
            const pagination: IPagination = { skip: skip ?? 0, limit: limit ?? 10 };
            const query: IQueryDeck = {
                from: from ? formatISO(parse(from, DATE_FORMAT, new Date())) : undefined,
                name,
                isPrivate,
            };

            const user = getCurrentUser(request.headers.authorization);

            return await searchDecksService(user.email.valueOf(), query, pagination);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
