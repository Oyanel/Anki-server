import expressLoader from "./express";
import { Application } from "express";
import { mongooseInit } from "./mongoose";
import swagger from "./swagger";

export default async (expressApp: Application) => {
    mongooseInit();
    console.log("MongoDB Intialized");

    await expressLoader(expressApp);
    console.log("Express Intialized");

    await swagger(expressApp);
};
