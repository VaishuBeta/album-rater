//import ColorThief from 'https://unpkg.com/colorthief@3/dist/umd/color-thief.global.js';
//import { FastAverageColor } from 'fast-average-color';

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
const changeSelectedColorForPaletteBtn = document.getElementById("changeSelectedColorForPaletteBtn");
const changeSelectedColorForPaletteLabel = document.getElementById("changeSelectedColorForPaletteLabel");
const root = document.documentElement;

let comments = {};
document.querySelectorAll('.table-comments-input').forEach(input => {
    const trackNum = input.dataset.track;
    comments[trackNum] = input.value; // initialize with default

    input.addEventListener('input', () => {
        comments[trackNum] = input.value;
        console.log(`Track ${trackNum} comment:`, comments[trackNum]);
    });
});

//the html file name, like "album name.html"
const pageId = window.location.pathname.split('/').pop();

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
    //colorFirst = colorPalette[0];
    //colorSecond = colorPalette[1];

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




    //console.log("Dark Vibrant: " + colorSwatch.DarkVibrant.color.hex());
    //console.log("Dark Vibrant: " + colorSwatch.DarkVibrant.color.hex());
    /*
    if (colorSwatch.DarkMuted) {
        albumDetailsContainer.style.backgroundColor = colorSwatch.DarkMuted.color.css();
    }*/

    //Exports the final (grand) color palette, which the page stores as the theme colors for further use.
    grandColorPalette = colorPalette;
    //grandColorPalette[0] = colorFirst;
    //grandColorPalette[1] = colorSecond;

    openPalette(grandColorPalette);

}


async function editData()
{
    titleSpan.innerHTML = `<input id="titleInput" type="text" placeholder="${title}"></input>`
    artistAndYearDiv.innerHTML = `<input id="artistInput" type="text" placeholder="${artist}"></input> • <input id="yearInput" type="text" placeholder="${year}"></input>`
    //artistSpan.innerHTML = `<input id="artistInput" type="text" placeholder="${artist}"></input>`
    //yearSpan.innerHTML = `<input id="yearInput" type="text" placeholder="${year}"></input>`

    buttonDiv.innerHTML = `<button id="saveEditsBtn" class="edit-and-update-btn">Update</button>`
    activateListener("update");
}

async function updateData()
{

    if (document.getElementById("titleInput").value != "")
    {title = document.getElementById("titleInput").value;}
    titleSpan.textContent = title;

    if (document.getElementById("artistInput").value != "")
    {artist = document.getElementById("artistInput").value;}
    //artistSpan.innerHTML = `${artist}`;

    if (document.getElementById("yearInput").value != "")
    {year = document.getElementById("yearInput").value;}
    //yearSpan.innerHTML = `${year}`;

    artistAndYearDiv.innerHTML = `<span id="artist" class="no-scrollbar"></span>  •  <span id="year" class="no-scrollbar"></span>`
    document.getElementById("artist").textContent = artist;
    document.getElementById("year").textContent = year;
    buttonDiv.innerHTML = `<button id="editBtn" class="edit-and-update-btn">Edit</button>`

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
    console.log(selectedColorType);

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

//document.getElementById("openPaletteBtn").addEventListener("click", openPalette);