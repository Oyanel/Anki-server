import User from "../models/authentication/User";
import { IProfile, IUser, IUserRegistration, TUserDecks } from "../models/authentication/User/IUser";
import { EHttpStatus, HttpError } from "../utils";
import { SALT_ROUND } from "../constant";
import { hashSync } from "bcryptjs";
import { isDeckAccessible, isDeckExisting } from "./deckService";
import { createReviewsService } from "./reviewService";
import { getCardService, getDeckCardsService } from "./cardService";

const isUserExisting = (email: String) => User.countDocuments({ email }).then((count) => count > 0);

export const isDeckOwned = async (email: string, deckId: string) => {
    const { reviewedDecks, privateDecks } = await getUserDecks(email);

    return reviewedDecks.concat(privateDecks).includes(deckId);
};

export const isCardReviewable = async (email: string, cardId: string) => {
    const { reviewedDecks, privateDecks } = await getUserDecks(email);
    const card = await getCardService(email, cardId, true);

    return reviewedDecks.concat(privateDecks).includes(card.deck);
};

export const registerService = async (user: IUserRegistration) => {
    if (await isUserExisting(user.email)) {
        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "Email already exists");
    }

    user.password = hashSync(user.password, SALT_ROUND);

    const profile = createProfile(user.username.valueOf());
    await User.create<IUser>({ email: user.email, profile, password: user.password });
};

export const joinDeckService = async (email: string, deckId: string) => {
    if (!(await isDeckExisting(deckId))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    if (!(await isDeckAccessible(email, deckId))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (await isDeckReviewed(email, deckId)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "You already review this deck");
    }

    await User.findOne({ email })
        .exec()
        .then(async (userDocument) => {
            userDocument.profile.reviewedDecks.push(deckId);
            await userDocument.save();
            const cards = await getDeckCardsService(deckId);
            await createReviewsService(
                email,
                cards.map((card) => card._id)
            );
        });
};

export const leaveDeckService = async (email: string, deckId: string) => {
    if (!(await isDeckExisting(deckId))) {
        throw new HttpError(EHttpStatus.NOT_FOUND, "Deck not found");
    }

    if (!(await isDeckAccessible(email, deckId))) {
        throw new HttpError(EHttpStatus.ACCESS_DENIED, "Forbidden");
    }

    if (!(await isDeckReviewed(email, deckId))) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "You don't review this deck");
    }

    User.findOne({ email })
        .exec()
        .then((userDocument) => {
            const decks = userDocument.profile.reviewedDecks;
            userDocument.profile.reviewedDecks.splice(decks.indexOf(deckId), 1);
            userDocument.save();
        });
};

export const getUserDecks = async (email: string): Promise<TUserDecks> =>
    await User.findOne({ email }).then((userDocument) => ({
        privateDecks: userDocument.profile.privateDecks,
        reviewedDecks: userDocument.profile.reviewedDecks,
    }));

export const addDeckToProfile = async (deckId: string, email: string) =>
    await User.findOne({ email })
        .exec()
        .then((user) => {
            user.profile.privateDecks.push(deckId);
            user.save();
        });

const createProfile = (username: string): IProfile => ({ username, privateDecks: [], reviewedDecks: [] });

export const isDeckReviewed = async (email: string, deckId: string) => {
    const { reviewedDecks, privateDecks } = await getUserDecks(email);

    return reviewedDecks.concat(privateDecks).includes(deckId);
};
