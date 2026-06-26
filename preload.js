const { contextBridge, ipcRenderer } = require('electron');
const { fileURLToPath } = require('url');

contextBridge.exposeInMainWorld('api', {
    title: "Rater",
    createAlbumPage: (data) => ipcRenderer.invoke('create-file', data),
    getAlbumPages: () => ipcRenderer.invoke('get-album-pages'),
});