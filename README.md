# SSR render page

Simple SSR page rendering tool based on JSDom and node-fetch libraries.

Installation:

`npm i ssr-render-page`

## Usage

```js
const SSRResourceConstructor = require('ssr-render-page')
const configSSRResource = { 
    // Server's origin host name
    origin: 'http://localhost:3000', 
    // Pathname for the root of the SSR page
    resourceName: '/resource/name', 
    // Path to the html file for SSR
    htmlFile: 'path/to/index.html', 
    // Optional: NodeJS' Http server object. Using for live-reloading if development flag is true
    server, 
    // Optional (default = true): Enable live-reloading of your SSR page
    development: true,
    // Optional (default = 8000 ms): Maximum time to wait before stopping page rendering
    waitingTime: 8000 
}
const renderResource = SSRResourceConstructor(configSSRPage)

app.get('/', async (req, res) => {
    const { html, statusCode } = await renderResource('/')
    res.status(statusCode).send(html)
})
```

To successful resolving of `renderResource()` promise you have to run `window.finishRender()` in the browser JavaScript after full rendering of the page. Before that you have to check that `window.finishRender()` run on the server side. For this purpose you can check `window.SSR` flag to establish that this JS file runs in the SSR mode. For example, in the browser JS after finish rendering of the page you can write this code:

```js
// Browser JavaScript code
if (window.SSR) window.finishRender()
```

Without the above code SSR rendering doesn't work!

## Very simple SSR example

### Project structure:

```
.
├── client - directory with the browser code
│   ├── index.html
│   └── script.js - browser JS
└── app.js - express server with SSR rendering

```

### app.js - express server with SSR rendering

```js
// app.js - express server with SSR rendering

const path = require('path')
const express = require('express')
const app = express()

const SSRResourceConstructor = require('ssr-render-page')
const resourceName = '/'

/** @type {import("ssr-render-page").renderPage}  */
let renderMessage;

// development config
function passServerToConfig(server) {
    renderMessage = SSRResourceConstructor({ 
        origin: 'http://localhost:3000', 
        resourceName, 
        htmlFile: path.join(__dirname, './client/index.html'),
        server, // Omit if production
        development: true // Omit if production
    })
}

// Page renderer route
app.get(resourceName, async (req, res) => {
    const { html, statusCode } = await renderMessage('/')
    res.status(statusCode).send(html)
})

app.get('/api/message', (req, res) => {
    res.send({ message: 'Hello world' })
})

app.get('*/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, './client/script.js'))
})

const server = app.listen(3000, () => {
    console.log('Server started at http://localhost:3000')
})

passServerToConfig(server)
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello page</title>
</head>
<body>
    <div id="root"></div>
    <script src="script.js"></script>
</body>
</html>
```

### script.js - browser JS

```js
// script.js - browser JavaScript

async function start() {
    const response = await fetch('/api/message')
    if (response.ok) {
        const { message } = await response.json()
        const root = document.getElementById('root')
        const header = document.createElement('h1')
        header.textContent = message
        root.append(header)
        // Send to SSR that rendering is complete
        window.finishRender()
    } else return Promise.reject('API error')
}

// Check that code running in SSR mode (not in the browser)
if (window.SSR) start().catch(console.error)
```