import { IDeck, IDeckResponse, IQueryDeck, TDeckDocument } from "../models/Deck/IDeck";
import Deck from "../models/Deck";
import { EHttpStatus, HttpError } from "../utils";
import { createCardService } from "./cardService";
import { FilterQuery, LeanDocument, Types } from "mongoose";

export const isDeckExisting = async (condition: FilterQuery<IDeck>) =>
    Deck.countDocuments(condition).then((count) => count > 0);

export const addCardService = async (deckId: string, front: [String], back: [String]) => {
    if (!(await isDeckExisting({ _id: Types.ObjectId(deckId) }))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    const cards = await createCardService(front, back);
    const cardId = Types.ObjectId(cards[0].id.toString());
    const reversedCardId = Types.ObjectId(cards[1].id.toString());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Deck.updateOne({ _id: Types.ObjectId(deckId) }, { $push: { cards: { $each: [cardId, reversedCardId] } } });

    return cards;
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

    return Deck.create<IDeck>(newDeck).then((deckDocument) => getDeckResponse(deckDocument));
};

export const getDeckService = async (id: string) =>
    Deck.findById(Types.ObjectId(id)).then((deckDocument) => {
        if (!deckDocument) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
        }

        return getDeckResponse(deckDocument);
    });

export const updateDeckService = async (id: string, name: string, description: string) => {
    if (await isDeckExisting({ name })) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The deck name already exists");
    }

    Deck.updateOne({ _id: Types.ObjectId(id) }, { name, description }).then((response) => {
        if (response.nModified === 0) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
        }
    });
};

export const deleteDeckService = async (id: string) =>
    Deck.findById(Types.ObjectId(id)).then((deck) => {
        if (!deck) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
        }
        deck.remove();
    });

export const searchDecksService = async (query: IQueryDeck) =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Deck.find({ name: { $regex: new RegExp(query.name ?? "", "i") }, createdAt: { $gt: query.createdAt } })
        .lean()
        .exec()
        .then((decks) => decks.map((deckDocument) => getDeckResponse(deckDocument)));

const getDeckResponse = (deckDocument: TDeckDocument | LeanDocument<TDeckDocument>) => {
    const deck: IDeckResponse = {
        id: deckDocument._id,
        name: deckDocument.name,
        description: deckDocument.description,
        cards: deckDocument.cards as String[],
    };

    return deck;
};
