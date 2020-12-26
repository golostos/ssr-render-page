const { EventEmitter } = require('events');
class MyEmitter extends EventEmitter { }
const fetch = require('node-fetch').default
const { JSDOM } = require("jsdom");
const { promisify } = require('util');
const fs = require('fs')
const path = require('path')

/**
 * Config SSR render for the resource name
 * @param {string} serverUrl 
 * @param {string} resourceName 
 * @param {string} htmlFile 
 */
function configSSRPage(serverUrl, resourceName, htmlFile, development = true) {

    function getPageUrl(pathname = '/', prefix = '') {
        if (pathname.startsWith('/')) pathname = pathname.slice(1)
        return new URL(`${prefix}/${pathname}`, serverUrl).href
    }

    let wsPort = 0

    if (development) wsInit(htmlFile).then((port) => wsPort = port).catch(console.error)

    /**
     * Render page by name
     * @param {string} pathname
     */
    async function renderPage(pathname = '/') {
        const renderEmitter = new MyEmitter()
        const finishRender = promisify(renderEmitter.once.bind(renderEmitter))
        
        const dom = await JSDOM.fromFile(htmlFile, {
            runScripts: "dangerously",
            resources: "usable",
            url: getPageUrl(pathname, resourceName),
            beforeParse(window) {
                /**
                 * @param {string} url 
                 * @param {import('node-fetch').RequestInit} options 
                 */
                // @ts-ignore
                window.fetch = (url, options) => {
                    return fetch(getPageUrl(url), options)
                }
                window.finishRender = () => renderEmitter.emit('finish')
                window.SSR = true
            }
        })

        if (development) {
            const readFile = promisify(fs.readFile)
            const wsInject = (await readFile(path.join(__dirname, 'wb-inject.js'), 'utf8')).replace('__PORT__', wsPort.toString())
            dom.window.document.body.insertAdjacentHTML('beforeend', `<script>${wsInject}</script>`)
        }

        await finishRender('finish')
        return dom.serialize()
    }

    return renderPage
}

async function wsInit(htmlFile) {
    const http = require('http');
    const WebSocket = require('ws');   
    const chokidar = require('chokidar'); 
    const dir = path.dirname(htmlFile)
    const server = http.createServer()
    const wss = new WebSocket.Server({ server });
    wss.on('connection', function connection(ws) {
        chokidar.watch(dir).on('change', (event, path) => {
            ws.send('reload');
        });
    });
    return new Promise((resolve, reject) => {
        server.listen(0, function () {
            resolve(server.address().port);
        })
    })

}

module.exports = configSSRPage