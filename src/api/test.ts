import { Request, Response } from "express";
import Review from "../models/Review";
import { Types } from "mongoose";

export const test = async (req: Request, res: Response) => {
    const rere = await Review.findOne({ card: Types.ObjectId("60b29ca82a1a590105f57c85") }).exec();
    console.log(rere);
    res.send(rere);
};
