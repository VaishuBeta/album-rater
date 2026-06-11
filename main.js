const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { getColor } = require('colorthief');

//const HTMLpageTemplate = ``;
function makeHTMLpageTemplate(title, cover, artist, year, tracks)
{
    const tracklistHTML = tracks.map(t => `
        <tr>
        <td class="table-number">${t.number}</td>
        <td class="table-title">${t.title}</td>
        <td class = "table-rating">
            <span class = "table-rating-inside">5.0</span>
        <td>
        <td class = "table-comments">No comments.<td>
        </tr>
        
        `).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="../albumpages.css">
</head>
<body>
    <div id="mainLayout">
        <section id="albumDetailsContainer">
            <div id="coverContainer"><img src="${cover}" alt="Album cover" width="90%" id="cover"></div>
            <br><br>
            <div id="title">${title}</div>
            <br>
            <div id="artist-and-year">
                <span id="artist" class="no-scrollbar">${artist}</span>  •  <span id="year" class="no-scrollbar">${year}</span>
            </div>

            <br><br>

            <div id="editButtonContainer">
                <button id="editBtn" class="edit-and-update-btn">Edit</button>
            </div>
        </section>
        

        <section id="tracklistContainer">
            Tracklist
            <table id="tracklist">${tracklistHTML}</table>
        </section>
    </div>

    <script type="module" src="../loadpage.js"></script>
</body>
</html>`;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1300,
        height: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')}
    });

    filetoLoadNum = 1;

    ipcMain.handle('create-file', (req, data) =>
    {
        console.log("Entered create-file function.")
        if(!data || !data.title || !data.cover || !data.artist || !data.year || !data.tracks)
        //if(false)
            {   console.log("Some data was missing. Data received: " + JSON.stringify(data));
                return false;}
        console.log("Entered file creation stage. Data passed through.")
        const HTMLpageTemplate = makeHTMLpageTemplate(data.title, data.cover, data.artist, data.year, data.tracks)
        const filePathTXT = path.join(__dirname, 'albumpages/txt', `${data.title}.txt`);
        const filePathHTML = path.join(__dirname, 'albumpages/html', `${data.title}.html`);
        fs.writeFileSync(filePathTXT, data.title +"\n" + data.cover + "\n" + data.artist + "\n" + data.year + "\n" + data.tracks.map(t => t.title).join("\n"));
        fs.writeFileSync(filePathHTML, HTMLpageTemplate);
        //filetoLoadNum = 2;

        return {success: true, path: filePathTXT};

    })
    win.loadFile('src/index.html');
}


app.whenReady().then(createWindow);
//Close the app on window close, except for Apple
app.on('window-all-closed', () => {
    //Mac is "Darwin"
    if (process.platform !== 'darwin') {
        app.quit();
    }
})