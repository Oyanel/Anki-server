import User, { EOTPReason, IProfile, IUser, IUserRegistration, TUserDecks } from "../models/authentication/User";
import Code from "../models/authentication/Otp";
import { EHttpStatus, HttpError, sendEmail } from "../utils";
import { SALT_ROUND } from "../constant";
import { hashSync } from "bcryptjs";
import { isDeckAccessible, isDeckExisting } from "./deckService";
import { createReviewsService, deleteUserReviewsService } from "./reviewService";
import { getCardsByDeckId, getCardService, getDeckCardsService } from "./cardService";
import { addMinutes, isBefore } from "date-fns";
import { logError } from "../utils/error/error";
import { changePasswordTemplate } from "../utils/email/changePasswordTemplate";

const isUserExisting = (email: string) => User.countDocuments({ email }).then((count) => count > 0);

export const isDeckOwned = async (email: string, deckId: string) => {
    const { privateDecks } = await getUserDecks(email);

    return privateDecks.includes(deckId);
};

export const isDeckReviewed = async (email: string, deckId: string) => {
    const { reviewedDecks, privateDecks } = await getUserDecks(email);

    return reviewedDecks.concat(privateDecks).includes(deckId);
};

export const isCardReviewable = async (email: string, cardId: string) => {
    const { reviewedDecks, privateDecks } = await getUserDecks(email);
    const card = await getCardService(email, cardId, true);

    return reviewedDecks.concat(privateDecks).includes(card.deck.toString());
};

export const registerService = async (user: IUserRegistration) => {
    if (await isUserExisting(user.email)) {
        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "Email already exists");
    }

    user.password = hashSync(user.password, SALT_ROUND);

    const profile = createProfile(user.username);
    await User.create<IUser>({ email: user.email, profile, password: user.password });
};

export const changeLostPassword = async (code: number, password: string) => {
    await Code.findOne({ code })
        .exec()
        .then(async (codeDocument) => {
            if (!codeDocument) {
                throw new HttpError(EHttpStatus.NOT_FOUND, "Code not found");
            }

            if (isBefore(new Date(codeDocument.expiresAt), new Date())) {
                throw new HttpError(EHttpStatus.BAD_REQUEST, "Code expired");
            }

            await User.findOne({ email: codeDocument.user })
                .exec()
                .then(async (userDocument) => {
                    userDocument.password = hashSync(password, SALT_ROUND);
                    await userDocument.save();
                });

            await codeDocument.deleteOne();
        });
};

export const createOTP = async (email: string, reason: EOTPReason) => {
    const code = Math.floor(100000 + Math.random() * 900000);

    try {
        await Code.findOneAndReplace(
            { user: email },
            { user: email, code, expiresAt: addMinutes(new Date(), 15) },
            { upsert: true }
        )
            .lean()
            .exec();
        if (reason === EOTPReason.CHANGE_PASSWORD) {
            await sendEmail([email], "changePassword", changePasswordTemplate(email, code));
        }
    } catch (error) {
        logError(error);

        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "Error occurred while creating the OTP");
    }
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

    if (await isDeckOwned(email, deckId)) {
        throw new HttpError(EHttpStatus.UNAUTHORIZED, "You can't leave your deck, delete it instead");
    }

    const userPromise = User.findOne({ email })
        .exec()
        .then((userDocument) => {
            const decks = userDocument.profile.reviewedDecks;
            userDocument.profile.reviewedDecks.splice(decks.indexOf(deckId), 1);
            userDocument.save();
        });

    const cardIdList = await getCardsByDeckId(deckId);
    const reviewsPromise = deleteUserReviewsService(cardIdList, email);

    await Promise.all([userPromise, reviewsPromise]);
};

export const getUserDecks = async (email: string): Promise<TUserDecks> =>
    User.findOne({ email }).then((userDocument) => ({
        privateDecks: userDocument.profile.privateDecks.map((deck) => deck.toString()),
        reviewedDecks: userDocument.profile.reviewedDecks.map((deck) => deck.toString()),
    }));

export const addDeckToProfile = async (deckId: string, email: string) =>
    User.findOne({ email })
        .exec()
        .then((user) => {
            user.profile.privateDecks.push(deckId);
            user.save();
        });

const createProfile = (username: string): IProfile => ({ username, privateDecks: [], reviewedDecks: [] });
