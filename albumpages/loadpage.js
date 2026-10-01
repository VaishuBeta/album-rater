let title = document.getElementById("title").textContent;
let artist = document.getElementById("artist").textContent;
let year = document.getElementById("year").textContent;
let cover = document.getElementById("cover");
const titleSpan = document.getElementById("title");
const artistSpan = document.getElementById("artist");
const yearSpan = document.getElementById("year");
const buttonDiv = document.getElementById("editButtonContainer");
const artistAndYearDiv = document.getElementById("artist-and-year");
const albumDetailsContainer = document.getElementById("albumDetailsContainer");
const tracklistContainer = document.getElementById("tracklistContainer");
const changePaletteContainer = document.getElementById("changePaletteContainer");
const paletteContainerMaster = document.getElementById("paletteContainerMaster");
const changeSelectedColorForPaletteBtn = document.getElementById("changeSelectedColorForPaletteBtn");
const changeSelectedColorForPaletteLabel = document.getElementById("changeSelectedColorForPaletteLabel");
const paletteBtn = document.getElementById("paletteBtn");
const paletteButtonContainer = document.getElementById("paletteButtonContainer");
const root = document.documentElement;

const searchURL = new URL('../src/index.html', import.meta.url).href;

// theres a few cases in this script where the console logs actually change the code for some reason
// deleting them breaks the code for whatever reason, so i just kept them in even though i would like to remove them

async function loadAlbumList() {
    const filesObj = await api.getAlbumPages();

    const topBanner = document.getElementById("topBanner");

    //reset the list so there's no duplicates
    topBanner.innerHTML = `<a href="${searchURL}" class="pageTabSearch"><svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>  Search</a><span class="fakeBorder"></span>`;

    if (filesObj.length === 0) {
        return;
    }

    filesObj.forEach(filePair => {
        const item = document.createElement('a');
        item.classList.add("pageTab")
        
        item.textContent = filePair.sanitizedTitle.replaceAll(".html", "");
        item.href = `${filePair.sanitizedTitle}`;

        const fakeBorder = document.createElement('span');
        fakeBorder.classList.add("fakeBorder");

        topBanner.appendChild(item);
        topBanner.appendChild(fakeBorder);

    })
}

loadAlbumList()


//the html file name, like "album name.html"
const pageId = window.location.pathname.split('/').pop();

// SONG COMMENTS
let comments = {};
document.querySelectorAll('.table-comments-input').forEach(input => {
    const trackNum = input.dataset.track;

    //if already saved in local storage, load that; else: 
    const saved = localStorage.getItem(`${pageId}_comment_${trackNum}`);
    if (saved !== null) { input.value = saved; }
    comments[trackNum] = input.value;

    input.addEventListener('input', () => {
        comments[trackNum] = input.value;
        localStorage.setItem(`${pageId}_comment_${trackNum}`, input.value);
    });
});

// SONG RATINGS
let songRatings = {};
 
// Converts a value (0-10) into display format: "10" for a perfect score,
// otherwise always one decimal place (e.g. "4.0", "9.8").
function formatRating(value) {
    return value === 10 ? '10' : value.toFixed(1);
}
 
// Parses whatever the user typed into a clamped 0-10 rating.
function parseRatingInput(raw) {
    // Keep only digits and (at most) one decimal point.
    let cleaned = '';
    let seenDot = false;
    for (const ch of raw) {
        if (ch >= '0' && ch <= '9') {
            cleaned += ch;
        } else if (ch === '.' && !seenDot) {
            cleaned += ch;
            seenDot = true;
        }
    }
 
    let value;
    if (cleaned.includes('.')) {
        // Explicit decimal was typed (e.g. "9.8") - parse it directly.
        // Truncate (not round) to 1 decimal place, per "extra digits are dropped".
        let parsed = parseFloat(cleaned);
        if (isNaN(parsed)) parsed = 0;
        value = Math.floor(parsed * 10) / 10;
    } else {
        // Pure digits, no decimal typed - cap at the first two digits.
        const digits = cleaned.slice(0, 2);
        if (digits.length === 0) {
            value = 0; // blank -> 0.0
        } else if (digits.length === 1) {
            value = parseFloat(digits); // single digit = whole rating, e.g. "5" -> 5.0
        } else if (digits === '10') {
            value = 10; // typing "10" is treated as a perfect score, not 1.0
        } else {
            value = parseFloat(digits[0] + '.' + digits[1]); // e.g. "98" -> 9.8
        }
    }
 
    return Math.max(0, Math.min(10, value)); // clamp to [0, 10]
}
 
// Opacity scales linearly from 0% at a rating of 0 to 100% at a rating of 10.
// This passes exactly through the requested anchor points (4.0 -> 40%, 10.0 -> 100%).
function ratingOpacity(value) {
    let percent = Math.max(0, Math.min(1, value / 10));
    return ((percent * 0.7) + 0.3);
}
 
// Applies background-only shading (never touches text color).
function applyRatingColor(input, value) {
    const cell = input.closest('span.table-rating-inside') || input;
    const opacity = ratingOpacity(value);
    cell.style.opacity = opacity;
}
 
document.querySelectorAll('.table-ratings-input').forEach(input => {
    const trackNum = input.dataset.track;
 
    // Load from localStorage (if present) and normalize its display format.
    const saved = localStorage.getItem(`${pageId}_rating_${trackNum}`);
    let initialValue = 0;
    if (saved !== null) {
        initialValue = Math.max(0, Math.min(10, parseFloat(saved) || 0));
    }
    input.value = formatRating(initialValue);
    songRatings[trackNum] = input.value;
    applyRatingColor(input, initialValue);
 
    function commitRating() {
        const value = parseRatingInput(input.value);
        const formatted = formatRating(value);
        input.value = formatted;
        songRatings[trackNum] = formatted;
        localStorage.setItem(`${pageId}_rating_${trackNum}`, formatted);
        applyRatingColor(input, value);
    }
 
    // While typing: behave like a normal text field, only blocking characters
    // that could never be part of a valid rating (letters, symbols, a 2nd '.').
    input.addEventListener('input', () => {
        let cleaned = '';
        let seenDot = false;
        for (const ch of input.value) {
            if (ch >= '0' && ch <= '9') {
                cleaned += ch;
            } else if (ch === '.' && !seenDot) {
                cleaned += ch;
                seenDot = true;
            }
        }
        if (cleaned !== input.value) {
            const pos = input.selectionStart;
            input.value = cleaned;
            input.setSelectionRange(pos - 1, pos - 1);
        }
    });
 
    // Enter submits the same way blur does.
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
 
    // Submission point: convert, clamp, format, save, recolor.
    input.addEventListener('blur', commitRating);
});

let grandColorPalette;
let colorFirst;
let colorSecond;

//Darken/lighten first color until it's the right luminance
function adjustColorsFromTwoMainColors(colorFirst, colorSecond)
{
    colorFirst = darkenColor(colorFirst, 0.2);
    colorFirst = lightenColor(colorFirst, 0.01);
    colorSecond = darkenColor(colorSecond, 0.2);
    colorSecond = lightenColor(colorSecond, 0.01);

    let colorBackground = blendColors(colorFirst.array(), [0, 0, 0], 0.7);

    //let colorBackground = darkenColor(colorFirst, 0.005);
    let colorDarkAccent = blendColors(colorSecond.array(), [0, 0, 0], 0.3);
    let colorLightText = lightenColor(colorSecond, 0.4);

    return [colorFirst, colorSecond, colorDarkAccent, colorLightText, colorBackground];
}

// This is not my function, I found this online.
function getRelativeLuminance(array) {
    // Transform 0-255 RGB values to 0.0-1.0 decimals
    const [vR, vG, vB] = array.map(val => val / 255);

    // Apply sRGB linearization (remove gamma correction)
    const linR = vR <= 0.03928 ? vR / 12.92 : Math.pow((vR + 0.055) / 1.055, 2.4);
    const linG = vG <= 0.03928 ? vG / 12.92 : Math.pow((vG + 0.055) / 1.055, 2.4);
    const linB = vB <= 0.03928 ? vB / 12.92 : Math.pow((vB + 0.055) / 1.055, 2.4);

    // Calculate weighted sum for relative luminance
    return 0.2126 * linR + 0.7152 * linG + 0.0722 * linB;
}

function darkenColor(color, maxLuminance = 0.3)
{
    while (getRelativeLuminance(color.array()) > maxLuminance)
    {
        let colorRGB = color.array();

        if (colorRGB[0] - 2 > 0) {colorRGB[0] = colorRGB[0] - 2;}
        else {colorRGB[0] = 0}

        if (colorRGB[1] - 2 > 0) {colorRGB[1] = colorRGB[1] - 2;}
        else {colorRGB[1] = 0}

        if (colorRGB[2] - 2 > 0) {colorRGB[2] = colorRGB[2] - 2;}
        else {colorRGB[2] = 0}

        color = ColorThief.createColor(colorRGB[0], colorRGB[1], colorRGB[2]);
    }
    return color;
}

function lightenColor(color, minLuminance = 0.01)
{
    while (getRelativeLuminance(color.array()) < minLuminance)
    {
        let colorRGB = color.array();

        if (colorRGB[0] + 2 < 255) {colorRGB[0] = colorRGB[0] + 2;}
        else {colorRGB[0] = 0}

        if (colorRGB[1] + 2 < 255) {colorRGB[1] = colorRGB[1] + 2;}
        else {colorRGB[1] = 0}

        if (colorRGB[2] + 2 < 255) {colorRGB[2] = colorRGB[2] + 2;}
        else {colorRGB[2] = 0}

        color = ColorThief.createColor(colorRGB[0], colorRGB[1], colorRGB[2]);
    }
    return color;
}

//Once again, not my function - I found this online. Takes ARRAY (RGB) INPUT.
function blendColors(color1, color2, bias = 0.5) {

  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;

  // Linear interpolation formula: a + (b - a) * bias
  const r = Math.floor(r1 + (r2 - r1) * bias);
  const g = Math.floor(g1 + (g2 - g1) * bias);
  const b = Math.floor(b1 + (b2 - b1) * bias);

  const color = ColorThief.createColor(r, g, b);
  return color;
  
}

//ALL OF THIS IS FOR MAKING THE BANNER COLORS AFTER THE IMAGE LOADS
if (cover.complete && cover.naturalWidth !== 0) {
    handleCoverLoaded();
} 
else
{cover.addEventListener('load', () => handleCoverLoaded())}

async function handleCoverLoaded()
{

    document.getElementById("coverContainer").style.backgroundColor = "#ffffff00";
    const colorPalette = ColorThief.getPaletteSync(cover);

    //IF YOU WANT TO SWITCH THE GRADIENT, MAKE THIS TRUE
    const reverseColors = false;

    /*I have NO clue why, but when I include colorFirst.hex() and colorSecond.hex()
    in the console log it works, and if i don't include it then it breaks.
    Logically it should have no effect becasue it's just a log, but somehow it does.*/
    try {
        if (localStorage.getItem(`${pageId}_colorFirstSaved`) == null)
        { throw new error("Null First Color"); }
        else
        {
            colorFirst = colorPalette[Number(localStorage.getItem(`${pageId}_colorFirstSaved`))]; console.log("Saved first color:" + colorFirst.hex());
        }
    }
    catch { colorFirst = colorPalette[0]; console.log("No stored Color 1 Found.");}
    
    try {
        if (localStorage.getItem(`${pageId}_colorSecondSaved`) == null)
        { throw new error("Null Second Color"); }
        else
        {
            colorSecond = colorPalette[Number(localStorage.getItem(`${pageId}_colorSecondSaved`))]; console.log("Saved second color:" + colorFirst.hex());
        }
    }
    catch { colorSecond = colorPalette[1]; console.log("No stored Color 2 Found.");}

    if (reverseColors == true)
    {
        colorFirst = colorPalette[1];
        colorSecond = colorPalette[0];
    }

    let colorArray = adjustColorsFromTwoMainColors(colorFirst, colorSecond);
    colorFirst = colorArray[0];
    colorSecond = colorArray[1];

    console.log(getRelativeLuminance(colorArray[0].array()));
    console.log(getRelativeLuminance(colorFirst.array()));
    console.log(colorFirst.hex());

    let colorDarkAccent = colorArray[2];
    let colorLightText = colorArray[3];
    let colorBackground = colorArray[4];

    albumDetailsContainer.style.backgroundImage = `linear-gradient(170deg,${colorFirst} 60%, ${colorSecond} 100%)`;
    document.body.style.backgroundColor = colorBackground;
    root.style.setProperty('--darkAccentColor', colorDarkAccent.hex());
    root.style.setProperty('--tracklistNumColor', colorLightText.hex());

    grandColorPalette = colorPalette;

    openPalette(grandColorPalette);

}


async function editData()
{
    titleSpan.innerHTML = `<input id="titleInput" type="text" placeholder="${title}"></input>`
    artistAndYearDiv.innerHTML = `<input id="artistInput" type="text" placeholder="${artist}"></input> • <input id="yearInput" type="text" placeholder="${year}"></input>`

    changeTable("toInput");

    buttonDiv.innerHTML = `<button id="saveEditsBtn" class="edit-and-update-btn"><svg id="updateButtonIcon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>`
    activateListener("update");
}

async function updateData()
{

    if (document.getElementById("titleInput").value != "")
    {title = document.getElementById("titleInput").value;}
    titleSpan.textContent = title;

    if (document.getElementById("artistInput").value != "")
    {artist = document.getElementById("artistInput").value;}

    if (document.getElementById("yearInput").value != "")
    {year = document.getElementById("yearInput").value;}

    artistAndYearDiv.innerHTML = `<span id="artist" class="no-scrollbar"></span>  •  <span id="year" class="no-scrollbar"></span>`
    document.getElementById("artist").textContent = artist;
    document.getElementById("year").textContent = year;
    buttonDiv.innerHTML = `<button id="editBtn" class="edit-and-update-btn"><svg id="editButtonIcon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>`

    changeTable("toText");

    activateListener("edit");
}

function ChangeColorOnBtnClick(i, colorPalette, selectedColorType)
{

    let colorArray;

    if (selectedColorType == "first")
    {
        colorArray = adjustColorsFromTwoMainColors(colorPalette[i], colorSecond);
        localStorage.setItem(`${pageId}_colorFirstSaved`, `${i}`);
    }
    else if (selectedColorType == "second")
    {
        colorArray = adjustColorsFromTwoMainColors(colorFirst, colorPalette[i]);
        localStorage.setItem(`${pageId}_colorSecondSaved`, `${i}`);
    }

    colorFirst = colorArray[0];
    colorSecond = colorArray[1];
    let colorDarkAccent = colorArray[2];
    let colorLightText = colorArray[3];
    let colorBackground = colorArray[4];

    albumDetailsContainer.style.backgroundImage = `linear-gradient(170deg,${colorFirst} 60%, ${colorSecond} 100%)`;
    document.body.style.backgroundColor = colorBackground;
    root.style.setProperty('--darkAccentColor', colorDarkAccent.hex());
    root.style.setProperty('--tracklistNumColor', colorLightText.hex());

    console.log(localStorage.getItem(`${pageId}_colorFirstSaved`));
    console.log(localStorage.getItem(`${pageId}_colorSecondSaved`));
}

let selectedColorType = "second";
function changeSelectedColorType()
    {
        selectedColorType = selectedColorType === "first" ? "second" : "first";
        if (selectedColorType === "first")
        {
            changeSelectedColorForPaletteLabel.textContent = "Primary Color";
        }
        else if (selectedColorType === "second")
        {
            changeSelectedColorForPaletteLabel.textContent = "Accent Color";
        }
        else { changeSelectedColorForPaletteLabel.textContent = "Unknown Color??";}
    }

changeSelectedColorForPaletteBtn.addEventListener("click", changeSelectedColorType);
function openPalette(grandColorPalette)
{

    console.log("In Func: " + grandColorPalette[0]);
    changePaletteContainer.innerHTML = ``;

    for (let i = 0; i < grandColorPalette.length; i++)
    {
        const btn = document.createElement('button');
        btn.id = "paletteColorButton";
        btn.style.backgroundColor = grandColorPalette[i].hex();
        btn.addEventListener('click', () => ChangeColorOnBtnClick(i, grandColorPalette, selectedColorType));
        changePaletteContainer.appendChild(btn);
    }
}

async function activateListener(type)
{
    if (type == "edit")
        { try { document.getElementById("editBtn").addEventListener("click", editData); } catch {console.log("EDIT BUTTON not found."); }}
    if (type == "update")
        { try { document.getElementById("saveEditsBtn").addEventListener("click", updateData); } catch { console.log("SAVEEDITS BUTTON not found."); }}
}

activateListener("edit");

let paletteOpen = false;
function togglePaletteContainer() {
    if (paletteOpen)
        { paletteOpen = false;
          paletteContainerMaster.style.display = "none";
          paletteBtn.innerHTML = `<svg id="paletteOpenIcon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-177 23q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120-160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm200 0q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120 160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/></svg>`;
          paletteBtn.classList.remove("palette-btn-close");
          paletteBtn.classList.add("palette-btn-open");
        }
    else if (!paletteOpen)
        { paletteOpen = true;
          paletteContainerMaster.style.display = "block";
          paletteBtn.innerHTML = `<svg id="paletteCloseIcon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80ZM303-457q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120-160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm200 0q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120 160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Z"/></svg>`;
          paletteBtn.classList.remove("palette-btn-open");
          paletteBtn.classList.add("palette-btn-close");
        }

}

function changeTable(type)
{
    if (type === "toInput")
    {
    document.querySelectorAll('.table-title').forEach(title => {
        //title.innerHTML = `<input class="table-title-input" type="text" value="${title.textContent}" placeholder="${title.textContent}"></input>`;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'table-title-input';
        input.value = title.textContent;
        input.placeholder = title.textContent;
        title.innerHTML = '';
        title.appendChild(input);
    })
    }
    else if (type === "toText")
    {
        document.querySelectorAll('.table-title').forEach(title => {
            const input = title.querySelector('.table-title-input');
            console.log(input.placeholder);
            if (input.value != "") {title.innerHTML = `${input.value}`;}
            else {title.innerHTML = `${input.placeholder}`;}
        })
    }

}


document.getElementById("paletteBtn").addEventListener("click", togglePaletteContainer);

//=================== EXPORT ===================
function exportAlbumData() {
    const data = {
        pageId: pageId,
        title: title,
        artist: artist,
        year: year,
        cover: cover.src,

        // store palette
        colorPalette: grandColorPalette ? grandColorPalette.map(c => c.hex()) : [],
        colorFirstIndex: localStorage.getItem(`${pageId}_colorFirstSaved`),
        colorSecondIndex: localStorage.getItem(`${pageId}_colorSecondSaved`),

        // initialize user data
        trackTitles: [],
        comments: {},
        songRatings: {}
    };

    //store user data -- next few blocks of code
    document.querySelectorAll('.table-title').forEach(titleEl => {
        // Works whether it's currently text or an input (in case export happens mid-edit)
        const input = titleEl.querySelector('.table-title-input');
        const trackNum = titleEl.dataset.track;
        const value = input ? (input.value || input.placeholder) : titleEl.textContent;
        data.trackTitles.push({ track: trackNum, title: value });
    });

    document.querySelectorAll('.table-comments-input').forEach(input => {
        data.comments[input.dataset.track] = input.value;
    });

    document.querySelectorAll('.table-ratings-input').forEach(input => {
        data.songRatings[input.dataset.track] = input.value;
    });

    // make the export popup for file saving
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageId.replace('.html', '')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

document.getElementById("exportBtn").addEventListener("click", exportAlbumData);