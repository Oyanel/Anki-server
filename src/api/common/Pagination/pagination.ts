import { Request } from "express";
import { IPagination } from "./IPagination";
import { EHttpStatus, HttpError } from "../../../utils";

export const getPagination = (req: Request) => {
    const page = req.query.page === undefined ? 1 : parseInt(<string>req.query.page);
    const pageSize = req.query.pageSize === undefined ? 20 : parseInt(<string>req.query.pageSize);

    if (isNaN(page) || isNaN(pageSize)) {
        throw new HttpError(EHttpStatus.BAD_REQUEST, "Pagination malformed");
    }

    const pagination: IPagination = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
    };

    console.log(pagination);

    return pagination;
};
