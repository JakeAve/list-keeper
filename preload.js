const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    let validChannels = [
      "read-all-notes",
      "get-note",
      "update-list",
      "create-new-list",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ["send-all-notes", "send-note", "new-list-created"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },
});
