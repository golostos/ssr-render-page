if ('WebSocket' in window) {
    function startSocket() {        
        var socket = new WebSocket('ws://localhost:__PORT__/__RESOURCE_NAME__');
        socket.onopen = function () {
            console.log('Live reload enabled.');
        };
        socket.onclose = function () {
            console.log('Socket closed')
            startSocket()
        };
        socket.onmessage = function (msg) {
            if (msg.data == 'reload') window.location.reload();            
        };        
    }
    startSocket();
}
else {
    console.error('Upgrade your browser. This Browser is NOT supported WebSocket for Live-Reloading.');
}
