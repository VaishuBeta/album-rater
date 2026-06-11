const { contextBridge, ipcRenderer } = require('electron');
const { fileURLToPath } = require('url');

contextBridge.exposeInMainWorld('api', {
    title: "Rater",
    createAlbumPage: (data) => ipcRenderer.invoke('create-file', data),
    getCoverHex: (imgPath) => {
        const colorThief = new ColorThief();
        const rgb = colorThief.getColor(toFilePath(imgPath));
        return rgbToHex(rgb);
    }
});