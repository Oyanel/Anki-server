import User from "../models/authentication/User";
import { IProfile, IUser, IUserRegistration } from "../models/authentication/User/IUser";
import { EHttpStatus, HttpError } from "../utils";
import { SALT_ROUND } from "../constant";
import { hashSync } from "bcrypt";
import { logError } from "../utils/error/error";
import { Types } from "mongoose";

const isUserExisting = (email: String) => User.countDocuments({ email }).then((count) => count > 0);

export const registerService = async (user: IUserRegistration) => {
    if (await isUserExisting(user.email)) {
        throw new HttpError(EHttpStatus.INTERNAL_ERROR, "Email already exists");
    }

    user.password = hashSync(user.password, SALT_ROUND);

    const profile = createProfile(user.username.valueOf());
    await User.create<IUser>({ email: user.email, profile, password: user.password });
};

export const isDeckOwned = async (userEmail: string, deckId: string) =>
    User.countDocuments({
        "profile.decks": {
            $in: Types.ObjectId(deckId),
        },
        email: userEmail,
    }).then((count) => count > 0);

export const addDeckToProfile = async (deckId: string, userEmail: string) =>
    await User.findOne({ email: userEmail })
        .exec()
        .then((user) => {
            user.profile.decks.push(deckId);
            user.save();
        })
        .catch((error) => {
            logError(error);
            throw error;
        });

const createProfile = (username: string): IProfile => ({ username, decks: [] });
