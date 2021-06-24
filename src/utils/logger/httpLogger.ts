import { config, createLogger, format as winstonFormat, transports } from "winston";
import { format } from "date-fns";
import { DATE_FORMAT } from "../../constant";
const { combine, timestamp, prettyPrint, colorize, errors } = winstonFormat;

const options = {
    console: {
        level: "debug",
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

export const logger = createLogger({
    levels: config.npm.levels,
    format: combine(
        errors({ stack: true }), // <-- use errors format
        colorize(),
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.File({
            filename: `./logs/error_${format(new Date(), DATE_FORMAT)}.log`,
            level: "error",
            handleExceptions: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
        }),
    ],
    exitOnError: false,
});

if (process.env.NODE_ENV !== "production") {
    logger.add(new transports.Console(options.console));
}

export const loggerConfig = {
    write: (message) => {
        logger.info(message);
    },
};
