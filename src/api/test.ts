import { Request, Response } from "express";
import { isDeckOwned } from "../services/userService";

export const test = async (req: Request, res: Response) => {
    const rere = await isDeckOwned("admin2@test.com", "60ad67ea4e956705c441fd49");

    res.send(rere);
};
