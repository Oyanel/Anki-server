import { Document } from "mongoose";

/**
 * @example {
 *  "user": "user.test@test.com",
 *  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXIudGVzdEB0ZXN0LmNvbSIsInVzZXJuYW1lIjoidGV0ZXN0cTI5MDN2OHJ1bUEiLCJpYXQiOjE2NDA3MjYzMDQsImV4cCI6MTY0MDcyOTkwNH0.B7RJGCXRZS_CasVsrW2d2EKrWt1puc2GMqqyPreFdiw",
 *  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXIudGVzdEB0ZXN0LmNvbSIsInVzZXJuYW1lIjoidGV0ZXN0cTI5MDN2OHJ1bUEiLCJpYXQiOjE2NDA3MjYzMDQsImV4cCI6MTY0MDcyOTkwNH0.B7RJGCXRZS_CasVsrW2d2EKrWt1puc2GMqqyPreFdiw",
 *  "accessTokenExpiresAt": "2021-12-12T00:00:00.000Z",
 *  "refreshTokenExpiresAt": "2021-12-12T00:00:00.000Z"
 * }
 */
export interface IToken {
    user: string;
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
}

export type TTokenDocument = IToken & Document;
