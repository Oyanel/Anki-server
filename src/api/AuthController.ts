import { IUserBase, IUserRegistration } from "../models/authentication/User/IUser";
import { loginService, refreshTokenService } from "../services/authService";
import { isEmail, isJWT, isStrongPassword } from "validator";
import { logError } from "../utils/error/error";
import { EHttpStatus, HttpError } from "../utils";
import { validateUsername } from "../models/authentication/User/validate";
import { registerService } from "../services/userService";
import { Body, Controller, Post, Response, Route, SuccessResponse, Tags } from "tsoa";
import { IToken } from "../models/authentication/Token/IToken";

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

        if (!isStrongPassword(password)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Password invalid");
        }

        if (!validateUsername(username.valueOf())) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Username incorrect");
        }

        try {
            await registerService(user);
            this.setStatus(EHttpStatus.CREATED);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }

    @Post("/token/refresh")
    @Response<HttpError>(EHttpStatus.BAD_REQUEST)
    public async refreshToken(@Body() token: { token: string }): Promise<IToken> {
        if (!isJWT(token)) {
            throw new HttpError(EHttpStatus.BAD_REQUEST, "Bad Request");
        }

        try {
            return await refreshTokenService(token.token);
        } catch (error) {
            logError(error);

            throw error instanceof HttpError ? error : new HttpError();
        }
    }
}
