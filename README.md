# SSR render page

Installation:

`npm i ssr-render-page`

Using:

```js
const configSSRPage = require('ssr-render-page')
const renderResource = configSSRPage('http://localhost:3000', 'resource', 'path/to/index.html')

app.get('/', async (req, res) => {
    res.send(await renderResource('/'))
})
```