import { Document } from "mongoose";

/**
 * @example {
 *  "username": "username",
 *  "language": "en",
 *  "privateDecks": ["123"],
 *  "reviewedDecks": ["123"]
 * }
 */
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
 *  "reason": "CONTACT",
 *  "message": "Hey, how is it going?"
 * }
 */
export interface IEmailRequest {
    reason: EEMailReason;
    message?: string;
}

/**
 * @example {
 *  "email": "user.test@test.com",
 *  "password": "LfasefSLEFs2d*",
 *  "username": "Johnny"
 * }
 */
export interface IUserRegistration extends IUserBase {
    username: string;
}

export interface IUser extends IUserBase {
    profile: IProfile;
}

/**
 * @example {
 *  "language": "en"
 * }
 */
export interface IChangeLanguageRequest {
    language: string;
}

export enum EEMailReason {
    CONTACT = "CONTACT",
    REPORT_BUG = "REPORT_BUG",
}

export enum EOTPReason {
    CHANGE_PASSWORD = "CHANGE_PASSWORD",
}

export interface IUserResponse {
    email: IUser["email"];
    username: IProfile["username"];
}

/**
 * @example {
 *  "newUsername": "Johnny"
 * }
 */
export interface IUpdateAccountRequest {
    newUsername?: IProfile["username"];
}

export type TUserDocument = IUser & Document;
