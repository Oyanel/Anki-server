import { IChangeLostPassword, IOtpRequest, IUserBase, IUserRegistration } from "../models/authentication/User";
import { loginService, refreshTokenService } from "../services/authService";
import { isEmail, isJWT } from "validator";
import { logError } from "../utils/error/error";
import { EHttpStatus, HttpError } from "../utils";
import { validatePassword, validateUsername } from "../models/authentication/User/validate";
import { changeLostPassword, createOTP, registerService } from "../services/userService";
import { Body, Controller, Post, Response, Route, SuccessResponse, Tags } from "tsoa";
import { IToken } from "../models/authentication/Token";

@Route("auth")
@Tags("Authentication")
@Response<HttpError>(EHttpStatus.INTERNAL_ERROR)
export class AuthController extends Controller {
    @Post("login")
    @Response<HttpError>(EHttpStatus.UNAUTHORIZED)
    public async login(@Body() user: IUserBase): Promise<IToken> {
        return loginService(user);
    }

    @Post("register")
    @Response<HttpError>(EHttpStatus.BAD_REQUEST)
    @SuccessResponse(EHttpStatus.CREATED)
    public async register(@Body() user: IUserRegistration): Promise<void> {
        const { password, email, username } = user;

        if (!isEmail(email)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Email invalid");
        }

        if (!validatePassword(password)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Password invalid");
        }

        if (!validateUsername(username)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Username incorrect");
        }

        try {
            await registerService(user);
            this.setStatus(EHttpStatus.CREATED);

            return;
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post("/token/refresh")
    @Response<HttpError>(EHttpStatus.BAD_REQUEST)
    public async refreshToken(@Body() token: { token: string }): Promise<IToken> {
        if (!isJWT(token.token)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            return await refreshTokenService(token.token);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post("/change_password")
    @Response<HttpError>(EHttpStatus.BAD_REQUEST)
    @SuccessResponse(EHttpStatus.NO_CONTENT)
    public async changeLostPassword(@Body() body: IChangeLostPassword): Promise<void> {
        const { code, password } = body;

        if (isNaN(code)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Code invalid");
        }

        if (!validatePassword(password)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Password invalid");
        }

        try {
            await changeLostPassword(code, password);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post("/otp")
    @Response<HttpError>(EHttpStatus.BAD_REQUEST)
    @SuccessResponse(EHttpStatus.CREATED)
    public async createOTP(@Body() body: IOtpRequest): Promise<void> {
        const { email, reason } = body;

        if (!isEmail(email)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Email invalid");
        }

        try {
            await createOTP(email, reason);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
