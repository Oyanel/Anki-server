import winston from "winston";

const options = {
    console: {
        level: "debug",
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

export const logger = winston.createLogger({
    levels: winston.config.npm.levels,
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(options.console),
        new winston.transports.File({
            filename: "./logs/error.log",
            level: "error",
            handleExceptions: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
        }),
    ],
    exitOnError: false,
});

export const loggerConfig = {
    write: (message) => {
        logger.info(message);
    },
};
