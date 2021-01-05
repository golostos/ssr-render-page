const { EventEmitter } = require('events');
class MyEmitter extends EventEmitter { }
const fetch = require('node-fetch').default
const { JSDOM } = require("jsdom");
const { promisify } = require('util');
const fs = require('fs')
const path = require('path')

/**
 * Config SSR render for the resource name
 * @param {Object} config SSR config
 * @param {string} config.origin Server's origin host name
 * @param {string} config.resourceName Pathname for the root of the SSR page
 * @param {string} config.htmlFile Path to the html file for SSR
 * @param {boolean} [config.development] Check to enable live reload SSR page while developing
 * @param {Object} [config.server] The NodeJS server to link to Live reload system 
 * @param {Object} [config.waitingTime] Maximum time to wait before stopping page rendering
 */
function SSRResourceConstructor({ origin, resourceName, htmlFile, development = true, server, waitingTime = 8000 }) {

    function getPageUrl(pathname = '/', prefix = '') {
        if (pathname.startsWith('/')) pathname = pathname.slice(1)
        if (prefix.startsWith('/')) prefix = prefix.slice(1)
        const url = new URL(`${prefix}/${pathname}`, origin).href;
        return url;
    }

    let wsPort = 0

    if (development) wsInit(htmlFile, resourceName, server).then((port) => wsPort = port).catch(console.error)

    /**
     * @typedef {Object} RenderedPage
     * @property {string} html - The rendered html page
     * @property {number} statusCode - The status code of this page
     */

    /**
     * Render page by name
     * @param {string} pathname The name of the rendered page
     * @return {Promise<RenderedPage>} The rendered html page and the status code of this page
     */
    async function renderPage(pathname = '/') {
        const renderEmitter = new MyEmitter()
        const url = getPageUrl(pathname, resourceName)
        const finishRender = promisify(renderEmitter.once.bind(renderEmitter))

        const dom = await JSDOM.fromFile(htmlFile, {
            runScripts: "dangerously",
            resources: "usable",
            url,
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
                window.statusCode = 200
            }
        })

        if (development) {
            const readFile = promisify(fs.readFile)
            const wsInject = (await readFile(path.join(__dirname, 'wb-inject.js'), 'utf8'))
                .replace('__PORT__', wsPort.toString())
                .replace('__RESOURCE_NAME__', resourceName.startsWith('/') ? resourceName.slice(1) : resourceName)
            dom.window.document.body.insertAdjacentHTML('beforeend', `<script>${wsInject}</script>`)
        }

        const wait = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('Maybe you forgot to run window.finishRender() in your browser\'s JavaScript after your rendering is complete. Or SSR is very slow.')
            }, waitingTime);
        })

        const result = await Promise.race([wait, finishRender('finish')])
        if (result && typeof result === 'string') return { html: result, statusCode: 500 }
        return { html: dom.serialize(), statusCode: dom.window.statusCode }
    }

    return renderPage
}

async function wsInit(htmlFile, resourceName, server) {
    const http = require('http');
    const url = require('url');
    const WebSocket = require('ws');
    const chokidar = require('chokidar');
    if (!resourceName.startsWith('/')) resourceName = '/' + resourceName
    const realServer = server ? true : false
    const dir = path.dirname(htmlFile)
    server = server || http.createServer()

    const wss = realServer ? new WebSocket.Server({ noServer: true }) : new WebSocket.Server({ server })

    wss.on('connection', function connection(ws) {
        chokidar.watch(dir).on('change', (event, path) => {
            ws.send('reload');
        });
    });

    if (realServer) server.on('upgrade', function upgrade(request, socket, head) {
        const pathname = url.parse(request.url).pathname;

        if (pathname === resourceName) {
            wss.handleUpgrade(request, socket, head, function done(ws) {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    })

    if (realServer) {
        return server.address().port
    } else return new Promise((resolve, reject) => {
        server.listen(0, function () {
            resolve(server.address().port);
        })
    })

}

module.exports = SSRResourceConstructor