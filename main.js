const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const cssURL = pathToFileURL(path.join(__dirname, 'albumpages', 'albumpages.css')).href;
const jsURL  = pathToFileURL(path.join(__dirname, 'albumpages', 'loadpage.js')).href;

if (require('electron-squirrel-startup')) app.quit();

console.log('NEW BUILD running, __dirname =', __dirname);

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
    //set up tracklist table html
    const tracklistHTML = tracks.map(t => `
        <tr class="table-row" data-track="${t.number}">
        <td class="table-number">${t.number}. </td>
        <td class="table-title">${escapeHTML(t.title)}</td>
        <td class = "table-rating">
            <span class = "table-rating-inside"><input type="text" oninput="if(this.value.length > 3) this.value = this.value.slice(0,3);" class="table-ratings-input" value="0.0" data-track="${t.number}"></span>
        <td>
        <td class = "table-comments"><input type="text" class="table-comments-input" value="" placeholder="No comments." data-track="${t.number}"><td>
        </tr>
        
        `).join("\n");

    //make the whole page format (tracklst injected in there from earlier)
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="${cssURL}">
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
            <div id="buttonsContainer">
                <div id="editButtonContainer">
                    <button id="editBtn" class="edit-and-update-btn"><svg id="editButtonIcon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                </div>
                   
                <div id="paletteButtonContainer">
                    <button id="paletteBtn" class="palette-btn-open"><svg id="paletteOpenIcon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-177 23q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120-160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm200 0q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120 160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/></svg></button>
                </div>

                <div id="exportButtonContainer">
                    <button id="exportBtn"><svg id="exportIcon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>
                </div>
            </div>
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

    <script type="module" src="${jsURL}"></script>
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
        let filePathJSON = path.join(jsonDir, `${data.sanitizedTitle}.json`);
        let filePathHTML = path.join(htmlDir, `${data.sanitizedTitle}.html`);

        //Check if the file already exists
        let i = 1;
        while (i < 50)
        {
        try {
            fs.accessSync(filePathHTML, fs.constants.F_OK);
            filePathHTML = path.join(htmlDir, `${data.sanitizedTitle} ${i}.html`);
            filePathJSON = path.join(jsonDir, `${data.sanitizedTitle} ${i}.json`);
            i++;
        }
        catch {
            break;
        }
        }

        const finalFilename = path.basename(filePathHTML);
        const indexPath = path.join(dataDir, 'index.json');

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

        return {success: true, path: filePathJSON, url: pathToFileURL(filePathHTML).href};

    })

    win.webContents.on('did-fail-load', (e, code, desc, url) => {
        console.log('LOAD FAILED:', code, desc, url);
    });


    // Then load the page, using an absolute path
    win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

//this came from claude -- finds all the html files in albumpages/html and returns them 
ipcMain.handle('get-album-pages', () => {
    const indexPath = path.join(dataDir, 'index.json');
    try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        return index
            .filter(a => fs.existsSync(path.join(htmlDir, a.sanitizedTitle)))
            .map(a => ({ ...a, url: pathToFileURL(path.join(htmlDir, a.sanitizedTitle)).href }));
    } catch {
        return [];
    }
});

app.whenReady().then(createWindow);
const dataDir = path.join(app.getPath('userData'), 'albumpages');
const htmlDir = path.join(dataDir, 'html');
const jsonDir = path.join(dataDir, 'json');
fs.mkdirSync(htmlDir, { recursive: true });
fs.mkdirSync(jsonDir, { recursive: true });
//Close the app on window close, except for Apple
app.on('window-all-closed', () => {
    //Mac is "Darwin"
    if (process.platform !== 'darwin') {
        app.quit();
    }
})