import { ICreateDeck, IDeck, IDeckResponse, IQueryDeck, TDeckDocument } from "../models/Deck/IDeck";
import Deck from "../models/Deck";
import { EHttpStatus, HttpError } from "../utils";
import { createCardService } from "./cardService";
import { FilterQuery, LeanDocument, Types } from "mongoose";
import { addDeckToProfile, isDeckOwned } from "./userService";
import { IPagination } from "../api/common/Pagination/IPagination";
import { TUserResponse } from "../models/authentication/User/IUser";
import { removeReviewsService } from "./reviewService";
import { ICreateCard } from "../models/Card/ICard";

export const isDeckExisting = async (condition: FilterQuery<IDeck>) =>
    Deck.countDocuments(condition).then((count) => count > 0);

export const isDeckAccessible = async (userDecks: String[], cardId: string) => {
    const isOwnedCondition = { _id: { $in: userDecks }, cards: { $in: Types.ObjectId(cardId) } };
    const isPublicCondition = { private: false };
    const orCondition = { $or: [isOwnedCondition, isPublicCondition] };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return await Deck.countDocuments(orCondition)
        .exec()
        .then((count) => count > 0);
};

export const isCardOwned = async (userDecks: String[], cardId: string, usePublicCards?: boolean) => {
    const orConditions = [];
    orConditions.push({ _id: { $in: userDecks }, cards: { $in: Types.ObjectId(cardId) } });

    if (usePublicCards) {
        orConditions.push({ private: false });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return await Deck.countDocuments({ $or: orConditions })
        .exec()
        .then((count) => count > 0);
};

export const addCardService = async (user: TUserResponse, deckId: string, card: ICreateCard) => {
    const { front, back, example, reverseCard } = card;
    if (!(await isDeckExisting({ _id: Types.ObjectId(deckId) }))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    if (!(await isDeckOwned(user.email.valueOf(), deckId))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    const cards = await createCardService(user, deckId, front, back, example, reverseCard);
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
    const { isPrivate, name, description } = deckQuery;
    const newDeck: IDeck = {
        name,
        description,
        cards: [],
        isPrivate: isPrivate ?? true,
    };

    const deck = await Deck.create<IDeck>(newDeck).then((deckDocument) => getDeckResponse(deckDocument));

    await addDeckToProfile(deck.id.valueOf(), userEmail);

    return deck;
};

export const getDeckService = async (userDecks: String[], id: string) => {
    if (!(await isDeckAccessible(userDecks, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    return await Deck.findById(Types.ObjectId(id)).then((deckDocument) => {
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
    if (!(await isDeckOwned(user.email.valueOf(), id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (isPrivate) {
        promises.push(removeReviewsService(user, id));
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

export const searchDecksService = async (userDecks: String[], query: IQueryDeck, pagination: IPagination) => {
    const isPrivateDeckCondition = { _id: { $in: userDecks } };
    const { isPrivate, name, from } = query;
    const isDeckPublicCondition = { isPrivate: false };
    const condition = {
        $or: [isPrivateDeckCondition, isDeckPublicCondition],
        name: { $regex: new RegExp(name ?? "", "i") },
        createdAt: from ? { $gt: from } : undefined,
        isPrivate,
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

const getDeckResponse = (deckDocument: TDeckDocument | LeanDocument<TDeckDocument>) => {
    const deck: IDeckResponse = {
        id: deckDocument._id,
        name: deckDocument.name,
        description: deckDocument.description,
        cards: deckDocument.cards as String[],
        isPrivate: deckDocument.isPrivate,
    };

    return deck;
};
