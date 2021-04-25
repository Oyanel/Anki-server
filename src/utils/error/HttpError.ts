import { EHttpStatus } from "../IHttp";

export class HttpError {
    status?: number;
    message?: string;

    constructor(status?: number, message?: string) {
        this.message = message || "Internal error";
        this.status = status || EHttpStatus.INTERNAL_ERROR;
    }
}
