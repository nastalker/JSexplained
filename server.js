// We bring in (import) the "http" module.
// This module helps us create a simple web server.
const http = require('http');

// We bring in the "fs" module to work with files (read, write, check if they exist).
const fs = require('fs');

// We bring in the "path" module to help us build file paths in a safe way.
const path = require('path');

// We bring in the promises version of "fs" so we can use async/await.
const fsPromises = require('fs').promises;

// We import our custom logEvents function from another file.
// This function will record logs (information) into text files.
const logEvents = require('./logEvents');

// We import EventEmitter so our program can listen for custom events.
const EventEmitter = require('events');

// We make a class "Emitter" that behaves like EventEmitter.
class Emitter extends EventEmitter {};

// We create a new object from our custom Emitter class.
const myEmitter = new Emitter()

// Whenever "log" happens, run logEvents().
myEmitter.on('log', (msg, fileName)=>logEvents(msg, fileName));

// PORT is the number where our server will run.
// If the computer gives a PORT value, use it. If not, use 3500.
const PORT = process.env.PORT || 3500;

/*
    This function serves (sends) a file to the user.
    filepath = where the file is
    contentType = the type of file (HTML, CSS, JSON, etc.)
    response = the response object from our server
*/
const serveFile = async(filepath, contentType, response) =>{
    try{
        // Read the file. If it's not an image, read it as text (utf8).
        const rawData = await fsPromises.readFile(
            filepath,
            !contentType.includes('images') ? 'utf8' :''
        );

        // If it's JSON, convert it into a JavaScript object.
        const data = contentType === 'application/json'
            ? JSON.parse(rawData) : rawData

        // Write the header (status code + content type)
        response.writeHead(
            filepath.includes('404.html') ? 404 : 200, 
            { 'content-Type': contentType }
        );

        // Send the file to the browser
        response.end(
            contentType === 'application/json' ? JSON.stringify(data) : data
        );
    }catch(err){
        // If something goes wrong, show the error
        console.log(err);

        // Log the error in a file
        myEmitter.emit('log', `${err.name}: ${err.message}`, "errLog.txt");

        // Tell the browser something broke on the server
        response.statusCode = 500;
        response.end();
    }
}

// Create the server.
const server = http.createServer((req, res)=>{
    // Show what page the user asked for.
    console.log(req.url, req.method);

    // Log the request in a text file
    myEmitter.emit('log', `${req.url}\t${req.method}`, "reqLog.txt");

    // Get the file extension (.html, .css, .js)
    const extension = path.extname(req.url)

    // Decide what type of file we are sending back.
    let contentType;

    switch(extension){
        case ".css":
            contentType = "text/css";
            break;
        case ".js":
            contentType = "text/javascripts";
            break;
        case ".json":
            contentType = 'application/json';
            break;
        case ".jpg":
            contentType = "image/jpeg";
            break;
        case ".png":
            contentType = "image/png";
            break;
        case ".txt":
            contentType = "text/plain";
            break;
        default:
            contentType = "text/html";   
    }

    /*
        Build the correct filepath for the requested file.
        If someone visits '/', give them index.html automatically.
        If it's a folder (ends with /), look inside for index.html.
    */
    let filepath = 
        contentType === "text/html" && req.url === "/"
            ? path.join(__dirname, 'views', 'index.html')
            : contentType === "text/html" && req.url.slice(-1) === "/"
                ? path.join(__dirname, 'views', req.url, 'index.html')
                : contentType === 'text/html'
                    ? path.join(__dirname, 'views', req.url)
                    : path.join(__dirname, req.url);
    
    // If the user didn't type a file extension, add ".html" automatically.
    if(!extension && req.url.slice(-1) !== '/') filepath += '.html';

    // Check if the file actually exists on the computer.
    const fileExists = fs.existsSync(filepath);

    if(fileExists){
        // If the file exists, send it to the browser.
        serveFile(filepath, contentType, res);
    } 
    else{
        /*
            If file does NOT exist:
            Check if we should redirect the user (301 redirect)
            Or show the 404 page.
        */
        switch(path.parse(filepath).base){
            case 'old-page.html':
                // Redirect to new page
                res.writeHead(301, {'Location': '/new-page.html'});
                res.end();
                break;

            case 'www-page.html':
                // Redirect to home page
                res.writeHead(301, {'Location': '/'});
                res.end();
                break;

            default:
                // Show 404 error page
                serveFile(path.join(__dirname, 'views', '404.html'),'text/html', res);
        } 
    }
})

// Start the server and listen on the PORT.
server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
