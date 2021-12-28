import { IChangeLanguageRequest } from "../models/authentication/User";
import { isLocale } from "validator";
import { logError } from "../utils/error/error";
import { EHttpStatus, getCurrentUserEmail, HttpError } from "../utils";
import { Body, Controller, Post, Request, Response, Route, Security, SuccessResponse, Tags } from "tsoa";
import { changeLanguage } from "../services/userService";
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
    public async createOTP(@Body() body: IChangeLanguageRequest, @Request() request: express.Request): Promise<void> {
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
}
