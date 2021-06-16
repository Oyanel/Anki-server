import { Document } from "mongoose";

export interface IProfile {
    username: String;
    decks: String[];
}

/**
 * @example {
 *  "email": "user.test@test.com",
 *  "password": "LfasefSLEFs2d*"
 * }
 */
export interface IUserBase {
    email: String;
    password: String;
}

/**
 * @example {
 *  "email": "user.test@test.com",
 *  "password": "LfasefSLEFs2d*"
 *  "username": "Johnny"
 * }
 */
export interface IUserRegistration extends IUserBase {
    username: String;
}

export interface IUser extends IUserBase {
    profile: IProfile;
}

export type TUserResponse = Omit<IUser, "password">;

export type TUserDocument = IUser & Document;
