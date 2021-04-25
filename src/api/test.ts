export const test1 = (req, res) => {
    return res.json({ test: "test" });
};

export const test2 = (req, res) => {
    res.json({ test: "test" });
};
