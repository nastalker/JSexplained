// We import the "format" function from date-fns.
// This helps us create nice, readable date and time strings.
const { format } = require('date-fns');

// We import "uuid" version 4.
// This creates a unique ID every time (like a fingerprint for each log).
const { v4: uuid } = require('uuid');

// We bring in the file system module ("fs").
// This helps us check if folders exist.
const fs = require('fs');

// We bring in the promises version of fs.
// This allows us to use async/await for reading & writing files.
const fsPromises = require('fs').promises;

// We bring in "path" to help build file paths safely.
const path = require('path');

/*
    logEvents()
    -----------------------------
    This function writes logs (messages) into a file.
    Every log will have:
        - date and time
        - a unique ID
        - the message text
*/
const logEvents = async (message, logName) => {

    // Create a readable date + time string.
    const dateTime = `${format(new Date(), 'yyy-MMMM-dd\tHH:mm:ss')}`;

    /*
        A log item is one single line of text with:
        - date and time
        - unique uuid
        - message text
    */
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    // Show the log in the console (optional but useful).
    console.log(logItem);

    try {
        /*
            First check if the "logs" folder exists.
            If not, create it!
        */
        if (!fs.existsSync(path.join(__dirname, 'logs'))) {
            // Make a new folder called "logs".
            await fsPromises.mkdir(path.join(__dirname, 'logs'));
        }

        /*
            Now, add (append) our log item into the chosen log file.
            logName is something like "reqLog.txt" or "errLog.txt".
        */
        await fsPromises.appendFile(
            path.join(__dirname, 'logs', logName),
            logItem
        );

    } catch (err) {
        // If something goes wrong, show the error.
        console.log(err)
    }
}

// Export the function so it can be used in other files.
module.exports = logEvents;
