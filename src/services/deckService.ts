import { IDeck, IDeckResponse } from "../models/Deck/IDeck";
import Deck from "../models/Deck";
import { EHttpStatus, HttpError } from "../utils";
import { logError } from "../utils/error/error";
import { createCardService } from "./cardService";
import { FilterQuery, Types } from "mongoose";

export const isDeckExisting = async (condition: FilterQuery<IDeck>) =>
    Deck.countDocuments(condition)
        .then((count) => count > 0)
        .catch((error: Error) => {
            logError(error);
            throw error;
        });

export const addCardService = async (deckId: string, front: string, back: string) => {
    if (!(await isDeckExisting({ _id: Types.ObjectId(deckId) }))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    const card = await createCardService(front, back);
    const cardId = Types.ObjectId(card.id.toString());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Deck.updateOne({ _id: Types.ObjectId(deckId) }, { $push: { cards: cardId } }).catch((error) => {
        logError(error);
        throw error instanceof HttpError ? error : new HttpError();
    });

    return card;
};

export const createDeckService = async (name: string, description: string) => {
    if (await isDeckExisting({ name })) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The deck name already exists");
    }

    const newDeck: IDeck = {
        name,
        description,
        cards: [],
    };

    return Deck.create<IDeck>(newDeck)
        .then((deckDocument) => {
            const deckResponse: IDeckResponse = {
                id: deckDocument._id,
                name: deckDocument.name,
                description: deckDocument.description,
                cards: deckDocument.cards,
            };

            return deckResponse;
        })
        .catch((error) => {
            logError(error);
            throw new HttpError();
        });
};

export const getDeckService = async (id: string) =>
    Deck.findById(Types.ObjectId(id))
        .then((deckDocument) => {
            if (!deckDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
            }

            const deckResponse: IDeckResponse = {
                id: deckDocument._id,
                name: deckDocument.name,
                description: deckDocument.description,
                cards: deckDocument.cards,
            };

            return deckResponse;
        })
        .catch((error) => {
            logError(error);
            throw error instanceof HttpError ? error : new HttpError();
        });

export const updateDeckService = async (id: string, name: string, description: string) => {
    if (await isDeckExisting({ name })) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The deck name already exists");
    }

    Deck.updateOne({ _id: Types.ObjectId(id) }, { name, description })
        .then((response) => {
            if (response.nModified === 0) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
            }
        })
        .catch((error) => {
            logError(error);
            throw error instanceof HttpError ? error : new HttpError();
        });
};

export const deleteDeckService = async (id: string) =>
    Deck.findById(Types.ObjectId(id))
        .then((deck) => {
            if (!deck) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
            }
            deck.remove();
        })
        .catch((error) => {
            logError(error);
            throw error instanceof HttpError ? error : new HttpError();
        });

export const getDecksService = async () =>
    Deck.find()
        .lean()
        .exec()
        .then((decks) =>
            decks.map((deckDocument) => {
                const deck: IDeckResponse = {
                    id: deckDocument._id,
                    cards: deckDocument.cards as string[],
                    description: deckDocument.description,
                    name: deckDocument.name,
                };

                return deck;
            })
        )
        .catch((error) => {
            logError(error);
            throw error instanceof HttpError ? error : new HttpError();
        });
