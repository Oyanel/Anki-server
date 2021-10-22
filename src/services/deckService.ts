import Deck, {
    ICreateDeck,
    IDeck,
    IDeckResponse,
    IDeckSummaryResponse,
    IQueryDeck,
    TDeckDocument,
} from "../models/Deck";
import { EHttpStatus, HttpError } from "../utils";
import { createCardService, searchCardsService } from "./cardService";
import { FilterQuery, LeanDocument, Types } from "mongoose";
import { addDeckToProfile, getUserDecks, isDeckOwned } from "./userService";
import { IPaginatedQuery, IPagination } from "../api/common/Pagination/IPagination";
import { ICardResponse, ICreateCard, IQueryCard } from "../models/Card";

export const isDeckExisting = async (deckId: string) =>
    Deck.countDocuments({ _id: new Types.ObjectId(deckId) }).then((count) => count > 0);

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
    const orConditions = [{ _id: { $in: privateDecks }, cards: { $in: new Types.ObjectId(cardId) } }];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Deck.countDocuments({ $or: orConditions })
        .exec()
        .then((count) => count > 0);
};

export const addCardService = async (email: string, deckId: string, card: ICreateCard) => {
    const { front, back, example, reverseCard, type } = card;
    if (!(await isDeckExisting(deckId))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    if (!(await isDeckOwned(email, deckId))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (!front.some((field) => field) && !back.some((field) => field)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The front and back fields cannot be empty");
    }

    const cards = await createCardService(email, deckId, front, back, example, reverseCard, type);
    const cardId = cards[0].id;

    await Deck.findOne({ _id: new Types.ObjectId(deckId) })
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
    const { isPrivate, name, description, tags } = deckQuery;
    const newDeck: IDeck = {
        name,
        description,
        tags,
        cards: [],
        isPrivate: isPrivate ?? true,
    };

    const deck = await Deck.create<IDeck>(newDeck).then((deckDocument) => getDeckSummaryResponse(deckDocument));

    await addDeckToProfile(deck.id, userEmail);

    return deck;
};

export const getDeckService = async (email: string, id: string, skip) => {
    if (!(await isDeckAccessible(email, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    return Deck.findById(new Types.ObjectId(id))
        .lean()
        .exec()
        .then(async (deckDocument) => {
            if (!deckDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
            }

            const paginatedCardQuery: IPaginatedQuery<IQueryCard> = {
                ids: deckDocument.cards,
                deck: deckDocument._id,
                reverse: false,
                limit: 50,
                skip,
            };

            const cards = await searchCardsService(email, paginatedCardQuery);

            return getDeckResponse(deckDocument, cards);
        });
};

export const updateDeckService = async (
    email: string,
    id: string,
    name: string,
    description: string,
    isPrivate: boolean
) => {
    const promises = [];
    if (!(await isDeckOwned(email, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    const updateDeckPromise = Deck.findById(new Types.ObjectId(id))
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
    Deck.findById(new Types.ObjectId(id)).then(async (deck) => {
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
    const { isPrivate, name, from, tags } = query;
    let conditionOperator = "$or";
    const privateCondition: FilterQuery<IDeck> = [{ isPrivate: isPrivate ?? false }];
    if (isPrivate || isPrivate === undefined) {
        privateCondition.push(isPrivateDeckCondition);
    }
    if (isPrivate) {
        conditionOperator = "$and";
    }
    const condition = {
        [conditionOperator]: privateCondition,
        isPrivate: isPrivate ? true : undefined,
        name: { $regex: new RegExp(name ?? "", "i") },
        createdAt: from ? { $gt: from } : undefined,
        tags: tags ? { $in: tags } : undefined,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Deck.find(condition)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec()
        .then((decks) => {
            return decks.map((deckDocument) => getDeckSummaryResponse(deckDocument));
        });
};

const getDeckSummaryResponse = (deckDocument: TDeckDocument | LeanDocument<TDeckDocument>): IDeckSummaryResponse => ({
    id: deckDocument._id,
    name: deckDocument.name,
    description: deckDocument.description,
    tags: deckDocument.tags,
    cards: deckDocument.cards,
    isPrivate: deckDocument.isPrivate,
});

const getDeckResponse = (
    deckDocument: TDeckDocument | LeanDocument<TDeckDocument>,
    cards: ICardResponse[]
): IDeckResponse => {
    return {
        id: deckDocument._id,
        name: deckDocument.name,
        description: deckDocument.description,
        tags: deckDocument.tags,
        cards: cards,
        isPrivate: deckDocument.isPrivate,
    };
};
