let title = document.getElementById("title").textContent;
let artist = document.getElementById("artist").textContent;
let year = document.getElementById("year").textContent;
let cover = document.getElementById("cover");
const titleSpan = document.getElementById("title");
const artistSpan = document.getElementById("artist");
const yearSpan = document.getElementById("year");
const buttonDiv = document.getElementById("editButtonContainer");

console.log(title + " " + artist + " " + year + "" + cover)

async function editData()
{
    titleSpan.innerHTML = `<input id="titleInput" type="text" placeholder="${title}"></input>`
    artistSpan.innerHTML = `<input id="artistInput" type="text" placeholder="${artist}"></input>`
    yearSpan.innerHTML = `<input id="yearInput" type="text" placeholder="${year}"></input>`

    buttonDiv.innerHTML = `<button id="saveEditsBtn" class="edit-and-update-btn">Update</button>`
    activateListener("update");
}

async function updateData()
{
    if (document.getElementById("titleInput").value != "")
    {title = document.getElementById("titleInput").value;}
    titleSpan.innerHTML = `${title}`;

    if (document.getElementById("artistInput").value != "")
    {artist = document.getElementById("artistInput").value;}
    artistSpan.innerHTML = `${artist}`;

    if (document.getElementById("yearInput").value != "")
    {year = document.getElementById("yearInput").value;}
    yearSpan.innerHTML = `${year}`;

    buttonDiv.innerHTML = `<button id="editBtn" class="edit-and-update-btn">Edit</button>`
    activateListener("edit");
}

async function activateListener(type)
{
    if (type = "edit")
        { try { document.getElementById("editBtn").addEventListener("click", editData); } catch {console.log("EDIT BUTTON not found."); }}
    if (type = "update")
        { try { document.getElementById("saveEditsBtn").addEventListener("click", updateData); } catch { console.log("SAVEEDITS BUTTON not found."); }}
}

activateListener("edit");