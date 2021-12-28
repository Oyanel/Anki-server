import { IChangeLanguageRequest } from "../models/authentication/User";
import { isLocale } from "validator";
import { logError } from "../utils/error/error";
import { EHttpStatus, getCurrentUserEmail, HttpError } from "../utils";
import { Body, Controller, Delete, Post, Request, Response, Route, Security, SuccessResponse, Tags } from "tsoa";
import { deleteUserAccount, changeLanguage } from "../services/userService";
import express from "express";

@Route("user")
@Tags("User")
@Security("Authorization")
@Response<HttpError>(EHttpStatus.BAD_REQUEST)
@Response<HttpError>(EHttpStatus.INTERNAL_ERROR)
export class UserController extends Controller {
    @Post("/change_language")
    @Response<HttpError>(EHttpStatus.BAD_REQUEST)
    @SuccessResponse(EHttpStatus.CREATED)
    public async changeLanguage(
        @Body() body: IChangeLanguageRequest,
        @Request() request: express.Request
    ): Promise<void> {
        const { language } = body;

        const email = getCurrentUserEmail(request.headers.authorization);

        if (!isLocale(language)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Invalid language");
        }

        try {
            await changeLanguage(email, language);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Delete("/delete")
    @SuccessResponse(EHttpStatus.OK)
    public async deleteAccount(@Request() request: express.Request): Promise<void> {
        const email = getCurrentUserEmail(request.headers.authorization);

        try {
            await deleteUserAccount(email);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
