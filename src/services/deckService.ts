import Deck, {
    ICreateDeck,
    IDeck,
    IDeckResponse,
    IDeckSummaryResponse,
    TEditDeck,
    IQueryDeck,
    TDeckDocument,
} from "../models/Deck";
import Tag from "../models/Tag";
import { EHttpStatus, HttpError } from "../utils";
import { createCardService, getCardIdsByDeckId, searchCardsService } from "./cardService";
import { FilterQuery, LeanDocument, Types } from "mongoose";
import { addDeckToProfile, getUserDecks, isDeckOwned, isDeckReviewed } from "./userService";
import { IPaginatedQuery, IPaginatedResponse, IPagination } from "../api/common/Pagination/IPagination";
import { ICardResponse, ICreateCard, IQueryCard } from "../models/Card";
import { deleteReviewsService } from "./reviewService";

export const isDeckExisting = async (deckId: string) =>
    Deck.countDocuments({ _id: new Types.ObjectId(deckId) }).then((count) => count > 0);

export const isDeckAccessible = async (email: string, deckId: string) => {
    const { privateDecks, reviewedDecks } = await getUserDecks(email);

    if (privateDecks.concat(reviewedDecks).includes(deckId.toString())) {
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
    const { front, back } = card;
    if (!(await isDeckExisting(deckId))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    if (!(await isDeckOwned(email, deckId))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (!front.some((field) => field) && !back.some((field) => field)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "The front and back fields cannot be empty");
    }

    const newCard = await createCardService(email, deckId, card);

    await Deck.findOne({ _id: new Types.ObjectId(deckId) })
        .exec()
        .then((deck) => {
            deck.cards.push(newCard.id);
            deck.save();
        });

    return newCard;
};

export const createDeckService = async (userEmail: string, deckQuery: ICreateDeck) => {
    const { isPrivate, name, description, tags, defaultCardType, defaultReviewReverseCard } = deckQuery;
    const newDeck: IDeck = {
        name,
        description,
        tags,
        cards: [],
        isPrivate: isPrivate ?? true,
        defaultCardType,
        defaultReviewReverseCard,
    };

    await addTagsService(tags);
    const deck = await Deck.create<IDeck>(newDeck).then((deckDocument) =>
        getDeckSummaryResponse(deckDocument, true, true, false)
    );

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
                limit: 50,
                skip,
            };

            const cards = await searchCardsService(email, paginatedCardQuery);

            const cardIdsToReview = cards.content
                .filter((card) => card.toReview || card.reverseToReview)
                .map((card) => card.id.toString());

            const shouldReview = cardIdsToReview.length !== 0;

            return getDeckResponse(
                deckDocument,
                cards,
                await isDeckReviewed(email, id),
                await isDeckOwned(email, deckDocument._id.toString()),
                shouldReview
            );
        });
};

export const updateDeckService = async (email: string, id: string, deck: TEditDeck) => {
    const { defaultCardType, defaultReviewReverseCard, name, description, tags, isPrivate } = deck;
    let shouldDeleteReview = false;
    if (!(await isDeckOwned(email, id))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    await Deck.findById(new Types.ObjectId(id))
        .exec()
        .then(async (deckDocument) => {
            if (!deckDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
            }

            shouldDeleteReview = !deckDocument.isPrivate && deck.isPrivate;
            deckDocument.name = name;
            deckDocument.description = description;
            deckDocument.isPrivate = isPrivate;
            deckDocument.defaultReviewReverseCard = defaultReviewReverseCard;
            deckDocument.defaultCardType = defaultCardType;
            deckDocument.tags = tags;
            await deckDocument.save();
        });

    if (shouldDeleteReview) {
        const cardIdList = await getCardIdsByDeckId(id);
        await deleteReviewsService(cardIdList, email);
    }
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

export const deleteDecksService = async (ids: string[]) =>
    Deck.find({ _id: { $in: ids } })
        .exec()
        .then((deckDocuments) => {
            deckDocuments.forEach((deckDocument) => {
                deckDocument.remove();
            });
        });

export const getTagsService = async (tag?: string): Promise<string[]> =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Tag.find({
        tag: { $regex: new RegExp(tag ?? "", "i") },
    })
        .exec()
        .then((tagDocuments) => tagDocuments.map((tagDocument) => tagDocument.tag));

export const addTagsService = async (tags?: string[]) =>
    Tag.insertMany(
        tags.map((tag) => new Tag({ tag: tag.toLowerCase() })),
        { ordered: false }
    ).catch((err) => {
        //skip duplicate error
        if (err.writeErrors) {
            return;
        }

        throw err;
    });

export const searchDecksService = async (
    email: string,
    query: IQueryDeck,
    pagination: IPagination
): Promise<IPaginatedResponse<IDeckSummaryResponse[]>> => {
    const { privateDecks, reviewedDecks } = await getUserDecks(email);
    const { isReviewed, name, from, tags, isToReview } = query;
    const reviewedDeckCondition: FilterQuery<IDeck> = isReviewed
        ? { _id: { $in: privateDecks.concat(reviewedDecks) } }
        : { _id: { $nin: privateDecks.concat(reviewedDecks) } };
    const condition = {
        ...reviewedDeckCondition,
        isPrivate: isReviewed ? undefined : false,
        name: { $regex: new RegExp(name ?? "", "i") },
        createdAt: from ? { $gt: from } : undefined,
        tags: tags ? { $in: tags } : undefined,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const deckCount = Deck.countDocuments(condition).exec();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const decks = await Deck.find(condition).skip(pagination.skip).limit(pagination.limit).exec();

    const deckSummaryList = await Promise.all(
        decks.map(async (deckDocument) => {
            const cards = await searchCardsService(email, {
                ids: deckDocument.cards.map((card) => card.toString()),
                toReview: isToReview,
                deck: deckDocument._id,
            });

            const cardIdsToReview = cards.content
                .filter((card) => card.toReview || card.reverseToReview)
                .map((card) => card.id.toString());

            const shouldReview = cardIdsToReview.length !== 0;

            if (isToReview) {
                deckDocument.cards = cardIdsToReview;
            }

            return getDeckSummaryResponse(
                deckDocument,
                isReviewed,
                privateDecks.includes(deckDocument._id.toString()),
                shouldReview
            );
        })
    );

    return {
        content:
            isToReview === undefined
                ? deckSummaryList
                : deckSummaryList.filter((deck) => isToReview === deck.isToReview),
        totalElements: isToReview
            ? deckSummaryList.filter((deck) => isToReview === deck.isToReview).length
            : await deckCount,
    };
};

const getDeckSummaryResponse = (
    deckDocument: TDeckDocument | LeanDocument<TDeckDocument>,
    isReviewed: boolean,
    isOwn: boolean,
    isToReview: boolean
): IDeckSummaryResponse => ({
    id: deckDocument._id,
    name: deckDocument.name,
    description: deckDocument.description,
    tags: deckDocument.tags,
    cards: deckDocument.cards.length,
    isPrivate: deckDocument.isPrivate,
    defaultReviewReverseCard: deckDocument.defaultReviewReverseCard,
    defaultCardType: deckDocument.defaultCardType,
    isReviewed,
    isOwn,
    isToReview,
});

const getDeckResponse = (
    deckDocument: TDeckDocument | LeanDocument<TDeckDocument>,
    cards: IPaginatedResponse<ICardResponse[]>,
    isReviewed: boolean,
    isOwn: boolean,
    isToReview: boolean
): IDeckResponse => ({
    id: deckDocument._id,
    name: deckDocument.name,
    description: deckDocument.description,
    tags: deckDocument.tags,
    cards: {
        content: cards.content,
        totalElements: cards.totalElements,
    },
    isPrivate: deckDocument.isPrivate,
    defaultReviewReverseCard: deckDocument.defaultReviewReverseCard,
    defaultCardType: deckDocument.defaultCardType,
    isReviewed,
    isOwn,
    isToReview,
});
