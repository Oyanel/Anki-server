import { Request, Response } from "express";
import { isCardOwned } from "../services/deckService";
import { getCurrentUser } from "../utils";

export const test = async (req: Request, res: Response) => {
    const user = getCurrentUser(req.headers.authorization.split(" ")[1]);
    const rere = await isCardOwned(user.profile.decks, "60ad7231debe910849eda662");

    res.send(rere);
};
