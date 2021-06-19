export interface IPagination {
    skip?: number;
    limit?: number;
}

export type IPaginatedQuery<T> = IPagination & T;
