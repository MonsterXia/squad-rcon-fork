import chalk from 'chalk';
import { format } from 'date-fns';
const getTime = () => format(new Date(), 'd LLL HH:mm:ss');
export const initLogger = (id, enabled) => ({
    log: (...text) => {
        enabled &&
            console.log(chalk.yellow(`[SquadRcon][${id}][${getTime()}]`), chalk.green(text));
    },
    warn: (...text) => {
        enabled &&
            console.log(chalk.yellow(`[SquadRcon][${id}][${getTime()}]`), chalk.magenta(text));
    },
    error: (...text) => {
        enabled &&
            console.log(chalk.yellow(`[SquadRcon][${id}][${getTime()}]`), chalk.red(text));
    },
});
