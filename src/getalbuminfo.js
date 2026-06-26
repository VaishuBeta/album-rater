const BASE_URL = "https://musicbrainz.org/ws/2";
const COVER_URL = "https://coverartarchive.org/release";
console.log("Hello World!");

/*const HEADERS = {
    "User-Agent": "VBAlbumRater/1.0"
};*/

window.searchType = "Title";


async function changeSearchType(type) {
    const searchInput = document.getElementById("searchInput");
    const IDInput = document.getElementById("IDInput");
    const inputSpan = document.getElementById("inputType");

    console.log("Entered changeSearchType function. Type: " + type);

    if (type === "Title") {
        console.log("innerHTML is now TITLE");
        inputSpan.innerHTML = `<input type="text" id="searchInput" class="search-input" placeholder="Search for an album..." />`
        window.searchType = "Title";
    } else if (type === "ID") {
        console.log("innerHTML is now ID");
        inputSpan.innerHTML = `<input type="text" id="IDInput" class="search-input" placeholder="Search by release ID..." />`
        window.searchType = "ID";
    }

}

async function getURLfromType() {
    if (window.searchType === "Title") {
        const query = document.getElementById("searchInput").value;
        return `${BASE_URL}/release/?query=${encodeURIComponent(query)}&fmt=json`;
    } else if (window.searchType === "ID") {
        const query = document.getElementById("IDInput").value;
        return `${BASE_URL}/release/${encodeURIComponent(query)}?&fmt=json`;
    }
}

async function searchAlbum() {

    console.log("WINDOW searchType:" + window.searchType);

    const url = await getURLfromType();
    //Try to fetch the data
    try {
        const response = await fetch(url);
        
        //Check for error
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

            if (window.searchType === "ID") {
                document.getElementById("results").innerHTML = '';
                showDetail(data);
                return;
            }
            console.log("FETCHED DATA. ENTERING RENDERLIST() FUNCTION");
            console.log("entering renderlist function with URL:" + url);
            renderList(data.releases?.slice(0, 10) || []);

            loadMoreResults = () => {
                const currentCount = document.getElementById("results").children.length;
                renderList(data.releases?.slice(0, currentCount + 10) || []);
            }
            hiddenButtons.innerHTML = "<button id='loadMoreBtn'>Load More Results</button>";
            document.getElementById("loadMoreBtn").addEventListener("click", loadMoreResults);

    } catch (error) {
        console.error("Error fetching album data:", error);
        document.getElementById("results").textContent = "Error fetching album data. Please try again.";
    }
}

function renderList(releases) {

    console.log("ENTERED RENDERLIST() FUNCTION");

    const list = document.getElementById("results");
    detailDiv = document.getElementById("detail");
    detailDiv.innerHTML = "";
    list.innerHTML = "";

    if (releases.length === 0) {
        list.innerHTML = "<li>No results found.</li>";

        console.log("No results found.");

        return;
    }

    releases.forEach(release => {

        console.log("Creating release element: " + release.title);
        console.log("Release: " + release.id);

        const li = document.createElement("li");
        const artist = release["artist-credit"]?.[0]?.artist?.name || "Unknown Artist";
        li.innerHTML = `<span class="hover-highlight"><b>${release.title}</b> <span id="subtle"> — ${artist} (${release.date?.slice(0, 4) || "?"})</span></span>`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => showDetail(release));
        list.appendChild(li);
    });
}

async function getTracklist(release) {
    releaseId = release.id;
    const url = `${BASE_URL}/release/${releaseId}?inc=recordings&fmt=json`;

    const response = await fetch(url);
    const data = await response.json();

    // media is an array of discs, each disc has a tracks array
    const tracks = data.media?.[0]?.tracks || [];

    return tracks.map(track => ({
        number: track.position,
        title: track.title,
        //length: track.length  // duration in milliseconds
    }));
}

async function showDetail(release) {
    const detail = document.getElementById("detail");
    const tracklist = document.getElementById("tracklistPreview");
    const artist = release["artist-credit"]?.[0]?.artist?.name || "Unknown Artist";
    const year = release.date?.slice(0, 4) || "Unknown Year";

    const hiddenButtons2 = document.getElementById("createPageBtnDiv")

    // Show info immediately, then try to load cover art
    detail.innerHTML = `
        <h2>${release.title}</h2>
        <br>
        <p id="coverStatus"><img src="../assets/alt cover cc.png" alt="Album cover" style="width:245px; height:245px; object-fit:cover;"></p>
        <br>
        <p><strong>Artist:</strong> ${artist}</p>
        <p><strong>Year:</strong> ${year}</p>
        <br>
        <button id='createPage'>Create Page</button>
    `;

    //Fetch tracklist
    console.log("Rendering tracklist");
    const tracks = await getTracklist(release);
    const tracklistHTML = tracks.map(t => {
        return `<li>${t.title}</li>`;
    }).join("");
    tracklist.innerHTML = `<h3>Tracklist</h3><ol id="tracklistList">${tracklistHTML}</ol>`;

    // Fetch cover art from Cover Art Archive
    try {
        const coverResponse = await fetch(`${COVER_URL}/${release.id}/front`);
        if (coverResponse.ok) {
            document.getElementById("coverStatus").innerHTML =
                `<img src="${COVER_URL}/${release.id}/front" alt="Album Cover" style="width:245px; height:245px; object-fit:cover;">`;
        } else {
            document.getElementById("coverStatus").innerHTML =
                `<img src="../assets/no cover found.png" alt="No Cover Found" style="width:245px; height:245px; object-fit:cover;">`;
        }
    } catch {
        document.getElementById("coverStatus").textContent = "Could not load cover art.";
    }

    //Create album page
    //hiddenButtons2.innerHTML = "<button id='createPage'>Create Page</button>";
    document.getElementById("createPage").addEventListener("click", () => createAlbumPage(release, artist, year, tracks));
}

async function createAlbumPage(release, artist, year, tracks)
{
    /*const title = album_title_el.value;
    const content = album_content_el.value;
    console.log('Button pressed, info recieved. Title: ' + title + ' Content: ' + content);

    api.createAlbumPageOld({title, content})

    //Reset values after creating
    album_title_el.value = "";
    album_content_el.value = "";*/
    const title = release.title
    
    /*
    const tracklistHTML = tracks.map(t => {
        return `<li>${t.title}</li>`;
    }).join("");
    */

    //Refer to LINE 131 in ShowDetail function on how to get the cover.
    //"${COVER_URL}/${release.id}/front"
    //cover = "https://coverartarchive.org/release/" + release.id + "/front";
    
    //ik the try/catch is redundant but idc
    try {
    const coverResponse = await fetch(`${COVER_URL}/${release.id}/front`);
        if (coverResponse.ok) {
            cover = "https://coverartarchive.org/release/" + release.id + "/front";
        } else {
            cover = "../../assets/no cover found.png"
        }
    }
    catch { cover = "../..assets/no cover found.png" }

    const sanitizedTitle = title.replace(/[/\\:*?"<>|]/g, '-');
    let albuminfo = {
        sanitizedTitle,
        title,
        cover,
        artist,
        year,
        tracks
    };

    albuminfo = await askPageInfo(sanitizedTitle, title, artist, year, cover, tracks);

    console.log(stringify(albuminfo));

    //MAKE FORM TO VERIFY ALL INFO BEFORE CREATION
    /*
    formEl = document.createElement('form');
    formEl.id = "verifyDataBeforeCreationForm";
    titleInput = document.createElement('input');
    artistInput = document.createElement('input');
    titleInput = document.createElement('input');
    */

    //otherpagesContainer = document.getElementById("goToOtherPages");
    //otherpagesContainer.innerHTML = `<a href="../albumpages/html/closed captions.html">closed captions</a>`;

    //console.log("Creating album page. INFO: " + JSON.stringify(albuminfo));
    //api.createAlbumPage(albuminfo)
    //loadAlbumList()

    //otherpagesContainer.innerHTML += `<li><a href="../albumpages/html/${title}.html">${title}</a></li>`;

    
}

async function loadAlbumList() {
    const filesObj = await api.getAlbumPages();

    albumList = document.getElementById("albumList");

    //reset the list so there's no duplicates
    albumList.innerHTML = '';

    if (filesObj.length === 0) {
        console.log("No files found in list. RETURNED.");
        return;
    }

    filesObj.forEach(filePair => {
        const itemCont = document.createElement('li');
        const item = document.createElement('a');
        
        item.textContent = filePair.sanitizedTitle;
        item.href = `../albumpages/html/${filePair.sanitizedTitle}`;
        console.log("File found and added: " + filePair.title);

        itemCont.appendChild(item);
        albumList.appendChild(itemCont);

    })
}

function askPageInfo(sanitizedTitle, title, artist, year, cover, tracks)
{
    const sanitizedTitleInput = document.getElementById("sanitizedTitleInput");
    const titleInput = document.getElementById("titleInput");
    const artistInput = document.getElementById("artistInput");
    const yearInput = document.getElementById("yearInput");
    const miniCover = document.getElementById("miniCover");
    const errorMessage = document.getElementById("errorMessage");
    const createPageAfterValidationBtn = document.getElementById("createPageAfterValidationBtn");

    sanitizedTitleInput.value = sanitizedTitle;
    titleInput.value = title;
    artistInput.value = artist;
    if (year != "Unknown Year") {yearInput.value = year;}
    else {yearInput.value = '';}

    document.getElementById("albumInfoForm").style.display = "flex";

    miniCover.src = cover;

    //check for special characters in sanitizedTitle, and set a flag to true if so.
    sanitizedTitleInput.addEventListener('input', function() {
        const currentValue = sanitizedTitleInput.value;
        const specialCharRegex = /[^a-zA-Z0-9_ -]/;

        if (specialCharRegex.test(currentValue)) {
            errorMessage.textContent = "No special characters allowed in the filename.";
        } else {
            errorMessage.textContent = "";
        }
    })
    //these lines came from claude
    const oldBtn = document.getElementById("createPageAfterValidationBtn");
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);


    return new Promise((resolve) => {
    newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            FsanitizedTitle = sanitizedTitleInput.value;
            Ftitle = titleInput.value;
            Fartist = artistInput.value;
            Fyear = yearInput.value;
            if (FsanitizedTitle && Ftitle && cover && Fartist && Fyear && Fartist)
            {
                albuminfo = {
                    sanitizedTitle: FsanitizedTitle,
                    title: Ftitle,
                    cover: cover,
                    artist: Fartist,
                    year: Fyear,
                    tracks: tracks };

                console.log("Creating album page. INFO: " + JSON.stringify(albuminfo));
                api.createAlbumPage(albuminfo);
                loadAlbumList();
                resolve(albuminfo);
            }
            else {console.log("Some information is missing in the album page."); resolve(albuminfo);}
        });
    });
}

loadAlbumList();

document.getElementById("albumSearchBtn").addEventListener("click", searchAlbum);
document.getElementById("searchToggleBtn-Title").addEventListener("click", () => changeSearchType("Title"));
document.getElementById("searchToggleBtn-ID").addEventListener("click",  () => changeSearchType("ID"));