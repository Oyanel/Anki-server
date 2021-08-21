import { Document } from "mongoose";

export interface IOtp {
    user: string;
    code: number;
    expiresAt: Date;
}

export type TOtpDocument = IOtp & Document;
