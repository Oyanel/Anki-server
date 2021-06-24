import { Document } from "mongoose";

export interface IProfile {
    username: string;
    privateDecks: string[];
    reviewedDecks: string[];
}

export type TUserDecks = Pick<IProfile, "privateDecks" | "reviewedDecks">;

/**
 * @example {
 *  "email": "user.test@test.com",
 *  "password": "LfasefSLEFs2d*"
 * }
 */
export interface IUserBase {
    email: string;
    password: string;
}

/**
 * @example {
 *  "email": "user.test@test.com",
 *  "password": "LfasefSLEFs2d*"
 *  "username": "Johnny"
 * }
 */
export interface IUserRegistration extends IUserBase {
    username: string;
}

export interface IUser extends IUserBase {
    profile: IProfile;
}

export type TUserResponse = Omit<IUser, "password">;

export type TUserDocument = IUser & Document;
