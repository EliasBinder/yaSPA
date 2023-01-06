const renderer = require("../../util/renderer");
const cacheMgr = require("../../util/cacheMgr");
const handle = (socket, msg) => {
    let lastModified = cacheMgr.getLastModified('c#' + msg.component);
    if (lastModified === msg.lastModified) {
        socket.emit('resp', {
            reqId: msg.reqId,
            notModified: true
        });
        return;
    }
    const html = renderer.getComponentHtml(msg.language, msg.component);
    const js = renderer.getComponentJs(msg.language, msg.component);
    lastModified = cacheMgr.getLastModified('c#' + msg.component);
    socket.emit('resp', {
        reqId: msg.reqId,
        html: html,
        js: js,
        lastModified: lastModified
    })
}

module.exports = {handle};
