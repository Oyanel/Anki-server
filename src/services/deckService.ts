import { IDeck, IDeckResponse, IQueryDeck, TDeckDocument } from "../models/Deck/IDeck";
import Deck from "../models/Deck";
import { EHttpStatus, HttpError } from "../utils";
import { createCardService } from "./cardService";
import { FilterQuery, LeanDocument, Types } from "mongoose";
import { addDeckToProfile, isDeckOwned } from "./userService";

export const isDeckExisting = async (condition: FilterQuery<IDeck>) =>
    Deck.countDocuments(condition).then((count) => count > 0);

export const addCardService = async (userEmail: string, deckId: string, front: [String], back: [String]) => {
    if (!(await isDeckExisting({ _id: Types.ObjectId(deckId) }))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    if (!(await isDeckOwned(userEmail, deckId))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    const cards = await createCardService(front, back);
    const cardId = Types.ObjectId(cards[0].id.toString());
    const reversedCardId = Types.ObjectId(cards[1].id.toString());

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Deck.updateOne({ _id: Types.ObjectId(deckId) }, { $push: { cards: { $each: [cardId, reversedCardId] } } });

    return cards;
};

export const createDeckService = async (userEmail: string, name: string, description: string) => {
    const newDeck: IDeck = {
        name,
        description,
        cards: [],
    };

    const deck = await Deck.create<IDeck>(newDeck).then((deckDocument) => getDeckResponse(deckDocument));

    await addDeckToProfile(deck.id.valueOf(), userEmail);

    return deck;
};

export const getDeckService = async (userEmail: string, id: string) => {
    if (!(await isDeckOwned(userEmail, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    return await Deck.findById(Types.ObjectId(id)).then((deckDocument) => {
        if (!deckDocument) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
        }

        return getDeckResponse(deckDocument);
    });
};

export const updateDeckService = async (userEmail: string, id: string, name: string, description: string) => {
    if (!(await isDeckOwned(userEmail, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    Deck.updateOne({ _id: Types.ObjectId(id) }, { name, description }).then((response) => {
        if (response.nModified === 0) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
        }
    });
};

export const deleteDeckService = async (userEmail: string, id: string) =>
    Deck.findById(Types.ObjectId(id)).then(async (deck) => {
        if (!deck) {
            throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
        }
        if (!(await isDeckOwned(userEmail, id))) {
            throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
        }
        deck.deleteOne();
    });

export const searchDecksService = async (query: IQueryDeck) =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    //TODO only private decks not all
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
