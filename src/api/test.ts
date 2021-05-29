import { Request, Response } from "express";
import Deck from "../models/Deck";

export const test = async (req: Request, res: Response) => {
    const rere = await Deck.find({});
    console.log(rere);
    res.send(rere);
};
