import Deck, { ICreateDeck, IDeck, IDeckResponse, IQueryDeck, TDeckDocument } from "../models/Deck";
import { EHttpStatus, HttpError } from "../utils";
import { createCardService } from "./cardService";
import { FilterQuery, LeanDocument, Types } from "mongoose";
import { addDeckToProfile, getUserDecks, isDeckOwned } from "./userService";
import { IPagination } from "../api/common/Pagination/IPagination";
import { TUserResponse } from "../models/authentication/User";
import { ICreateCard } from "../models/Card";

export const isDeckExisting = async (deckId: string) =>
    Deck.countDocuments({ _id: Types.ObjectId(deckId) }).then((count) => count > 0);

export const isDeckAccessible = async (email: string, deckId: string) => {
    const { privateDecks, reviewedDecks } = await getUserDecks(email);

    if (privateDecks.concat(reviewedDecks).includes(deckId)) {
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Deck.findById(deckId)
        .lean()
        .exec()
        .then((deckDocument) => !deckDocument.isPrivate);
};

export const isCardOwned = async (email: string, cardId: string) => {
    const { privateDecks } = await getUserDecks(email);
    const orConditions = [{ _id: { $in: privateDecks }, cards: { $in: Types.ObjectId(cardId) } }];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Deck.countDocuments({ $or: orConditions })
        .exec()
        .then((count) => count > 0);
};

export const addCardService = async (email: string, deckId: string, card: ICreateCard) => {
    const { front, back, example, reverseCard } = card;
    if (!(await isDeckExisting(deckId))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    if (!(await isDeckOwned(email, deckId))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    const cards = await createCardService(email, deckId, front, back, example, reverseCard);
    const cardId = cards[0].id;

    await Deck.findOne({ _id: Types.ObjectId(deckId) })
        .exec()
        .then((deck) => {
            deck.cards.push(cardId);
            if (reverseCard) {
                deck.cards.push(cards[1].id);
            }
            deck.save();
        });

    return cards;
};

export const createDeckService = async (userEmail: string, deckQuery: ICreateDeck) => {
    const { isPrivate, name, description, modelType, tags } = deckQuery;
    const newDeck: IDeck = {
        name,
        modelType,
        description,
        tags,
        cards: [],
        isPrivate: isPrivate ?? true,
    };

    const deck = await Deck.create<IDeck>(newDeck).then((deckDocument) => getDeckResponse(deckDocument));

    await addDeckToProfile(deck.id, userEmail);

    return deck;
};

export const getDeckService = async (email: string, id: string) => {
    if (!(await isDeckAccessible(email, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    return Deck.findById(Types.ObjectId(id))
        .lean()
        .exec()
        .then((deckDocument) => {
            if (!deckDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
            }

            return getDeckResponse(deckDocument);
        });
};

export const updateDeckService = async (
    user: TUserResponse,
    id: string,
    name: string,
    description: string,
    isPrivate: boolean
) => {
    const promises = [];
    if (!(await isDeckOwned(user.email, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    const updateDeckPromise = Deck.findById(Types.ObjectId(id))
        .exec()
        .then(async (deckDocument) => {
            if (!deckDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
            }
            deckDocument.name = name;
            deckDocument.description = description;
            deckDocument.isPrivate = isPrivate;
            await deckDocument.save();
        });

    promises.push(updateDeckPromise);

    await Promise.all(promises);
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

export const searchDecksService = async (email: string, query: IQueryDeck, pagination: IPagination) => {
    const { privateDecks } = await getUserDecks(email);
    const isPrivateDeckCondition = { _id: { $in: privateDecks } };
    const { isPrivate, name, from, tags, modelType } = query;
    const orCondition: FilterQuery<IDeck> = [{ isPrivate: isPrivate ?? false }];
    if (isPrivate || isPrivate === undefined) {
        orCondition.push(isPrivateDeckCondition);
    }
    const condition = {
        $or: orCondition,
        isPrivate: isPrivate ? true : undefined,
        name: { $regex: new RegExp(name ?? "", "i") },
        createdAt: from ? { $gt: from } : undefined,
        tags: tags ? { $in: tags } : undefined,
        modelType,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Deck.find(condition)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec()
        .then((decks) => {
            return decks.map((deckDocument) => getDeckResponse(deckDocument));
        });
};

const getDeckResponse = (deckDocument: TDeckDocument | LeanDocument<TDeckDocument>): IDeckResponse => ({
    id: deckDocument._id,
    modelType: deckDocument.modelType,
    name: deckDocument.name,
    description: deckDocument.description,
    tags: deckDocument.tags,
    cards: deckDocument.cards,
    isPrivate: deckDocument.isPrivate,
});
