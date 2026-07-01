const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
//const { getColor } = require('colorthief');

//FUNCTION: Converts any string to an escapable version
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')   // must be first
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

//const HTMLpageTemplate = ``;
function makeHTMLpageTemplate(title, cover, artist, year, tracks)
{
    const tracklistHTML = tracks.map(t => `
        <tr>
        <td class="table-number">${t.number}. </td>
        <td class="table-title">${escapeHTML(t.title)}</td>
        <td class = "table-rating">
            <span class = "table-rating-inside"><input type="text" oninput="if(this.value.length > 3) this.value = this.value.slice(0,3);" class="table-ratings-input" value="0.0" data-track="${t.number}"></span>
        <td>
        <td class = "table-comments"><input type="text" class="table-comments-input" value="No comments." data-track="${t.number}"><td>
        </tr>
        
        `).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="../albumpages.css">
</head>
<body>
    <span id="blackScreenforTransition"></span>
    <div id="topBanner" class="no-scrollbar">
    <span id="pageTab">Search</span>
    </div>
    <div id="mainLayout">
        <section id="albumDetailsContainer">
            <div id="coverContainer"><img src="${escapeHTML(cover)}" alt="Album cover" id="cover"></div>
            <br><br>
            <div id="title">${escapeHTML(title)}</div>
            <br>
            <div id="artist-and-year">
                <span id="artist" class="no-scrollbar">${escapeHTML(artist)}</span>  •  <span id="year" class="no-scrollbar">${escapeHTML(year)}</span>
            </div>

            <br><br>
            <div id="editButtonContainer">
                <button id="editBtn" class="edit-and-update-btn">Edit</button>
            </div>
            <br>
            <div id="paletteContainerMaster">
                <button id="changeSelectedColorForPaletteBtn"><svg xmlns="http://www.w3.org/2000/svg" id="switchIcon" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF" style="vertical-align: middle;"><path d="M480-80q-143 0-253-90T88-400h82q28 106 114 173t196 67q86 0 160-42.5T756-320H640v-80h240v240h-80v-80q-57 76-141 118T480-80Zm-85-315q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35ZM80-560v-240h80v80q57-76 141-118t179-42q143 0 253 90t139 230h-82q-28-106-114-173t-196-67q-86 0-160 42.5T204-640h116v80H80Z"/></svg></button>
                <span id="changeSelectedColorForPaletteLabel"> Accent Color</span>
                <div id="changePaletteContainer"></div>
            </div>
        </section>
        

        <section id="tracklistContainer">
            <span class="tracklist-title">Tracklist</span>
            <table id="tracklist">${tracklistHTML}</table>
        </section>
    </div>

    <script type="module" src="../loadpage.js"></script>
    <script src="https://unpkg.com/colorthief@3/dist/umd/color-thief.global.js"></script>
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
        if(!data || !data.sanitizedTitle || !data.title || !data.cover || !data.artist || !data.year || !data.tracks)
            {   console.log("Some data was missing. Data received: " + JSON.stringify(data)); return false; }
        const HTMLpageTemplate = makeHTMLpageTemplate(data.title, data.cover, data.artist, data.year, data.tracks);
        let filePathJSON = path.join(__dirname, 'albumpages/txt', `${data.sanitizedTitle}.txt`);
        let filePathHTML = path.join(__dirname, 'albumpages/html', `${data.sanitizedTitle}.html`);

        //Check if the file already exists
        let i = 1;
        while (i < 50)
        {
        try {
            fs.accessSync(filePathHTML, fs.constants.F_OK);
            filePathHTML = path.join(__dirname, 'albumpages/html', `${data.sanitizedTitle} ${i}.html`);
            filePathJSON = path.join(__dirname, 'albumpages/json', `${data.sanitizedTitle} ${i}.json`);
            i++;
        }
        catch {
            break;
        }
        }

        const finalFilename = path.basename(filePathHTML);
        const indexPath = path.join(__dirname, 'albumpages', 'index.json');

        //Get index array from index.json
        let index = [];
        try {
            const raw = fs.readFileSync(indexPath, 'utf-8');
            index = JSON.parse(raw);
        } catch {
            index = [];
        }

        //Add new album to the index, then rewrite and put it back in index.json
        index.push({ title: data.title, sanitizedTitle: finalFilename });
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

        fs.writeFileSync(filePathJSON, data.title +"\n" + data.cover + "\n" + data.artist + "\n" + data.year + "\n" + data.tracks.map(t => t.title).join("\n"));
        fs.writeFileSync(filePathHTML, HTMLpageTemplate);
        
        //filetoLoadNum = 2;

        return {success: true, path: filePathJSON};

    })
    win.loadFile('src/index.html');
}

//this came from claude -- finds all the html files in albumpages/html and returns them 
ipcMain.handle('get-album-pages', () => {
    const indexPath = path.join(__dirname, 'albumpages', 'index.json');
    try {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        console.log("index.json WAS FOUND.")
        return JSON.parse(raw);
    } catch {
        return [];
    }
});

app.whenReady().then(createWindow);
//Close the app on window close, except for Apple
app.on('window-all-closed', () => {
    //Mac is "Darwin"
    if (process.platform !== 'darwin') {
        app.quit();
    }
})