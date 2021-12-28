import { Document } from "mongoose";

export interface IProfile {
    username: string;
    language: string;
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
 *  "code": "1234",
 *  "password": "LfasefSLEFs2d*"
 * }
 */
export interface IChangeLostPassword {
    code: number;
    password: string;
}

/**
 * @example {
 *  "email": "user.test@test.com",
 *  "reason": "CHANGE_PASSWORD"
 * }
 */
export interface IOtpRequest {
    email: string;
    reason: EOTPReason;
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

export interface IChangeLanguageRequest {
    language: string;
}

export enum EOTPReason {
    CHANGE_PASSWORD = "CHANGE_PASSWORD",
}

export interface IUserResponse {
    email: IUser["email"];
    username: IProfile["username"];
}

export type TUserDocument = IUser & Document;
