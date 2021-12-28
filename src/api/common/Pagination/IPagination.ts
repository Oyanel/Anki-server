export interface IPagination {
    skip?: number;
    limit?: number;
}

export interface IPaginatedResponse<T> {
    content: T;
    totalElements: number;
}

export type IPaginatedQuery<T> = IPagination & T;
