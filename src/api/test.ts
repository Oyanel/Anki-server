import { Application } from "express";

export const test = (app: Application) => {
    app.get("/test1", test1);
    app.get("/test2", test2);

    return app;
};

const test1 = (req, res) => {
    return res.json({ test: "test" });
};

const test2 = (req, res) => {
    res.json({ test: "test" });
};
