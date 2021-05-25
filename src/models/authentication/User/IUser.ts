import { Document } from "mongoose";

export interface IProfile {
    username: String;
    decks: String[];
}

export interface IUserBase {
    email: String;
    password: String;
}

export interface IUserRegistration extends IUserBase {
    username: String;
}

export interface IUser extends IUserBase {
    profile: IProfile;
}

export type TUserResponse = Omit<IUser, "password">;

export type TUserDocument = IUser & Document;
