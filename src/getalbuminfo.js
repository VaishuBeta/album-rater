// website starts, just saves time later
const BASE_URL = "https://musicbrainz.org/ws/2";
const COVER_URL = "https://coverartarchive.org/release";
const ITUNES_BASE_URL = "https://itunes.apple.com";
const NO_COVER = new URL('../assets/no cover found.png', document.baseURI).href;

window.searchType = "Title";
window.searchTypeItunes = "Title";


async function changeSearchType(type) {
    const inputSpan = document.getElementById("inputType");

    if (type === "Title") {
        inputSpan.innerHTML = `<input type="text" id="searchInput" class="search-input" placeholder="Search for an album..." />`
        window.searchType = "Title";
    } else if (type === "ID") {
        inputSpan.innerHTML = `<input type="text" id="IDInput" class="search-input" placeholder="Search by release ID..." />`
        window.searchType = "ID";
    }
}

async function changeSearchTypeItunes(type) {
    const inputSpan = document.getElementById("inputTypeItunes");

    if (type === "Title") {
        inputSpan.innerHTML = `<input type="text" id="searchInputItunes" class="search-input" placeholder="Search for an album..." />`
        window.searchTypeItunes = "Title";
    } else if (type === "ID") {
        inputSpan.innerHTML = `<input type="text" id="IDInputItunes" class="search-input" placeholder="Search by collection ID..." />`
        window.searchTypeItunes = "ID";
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

async function getURLfromTypeItunes() {
    if (window.searchTypeItunes === "Title") {
        const query = document.getElementById("searchInputItunes").value;
        return `${ITUNES_BASE_URL}/search?term=${encodeURIComponent(query)}&entity=album&limit=25`;
    } else if (window.searchTypeItunes === "ID") {
        const query = document.getElementById("IDInputItunes").value;
        return `${ITUNES_BASE_URL}/lookup?id=${encodeURIComponent(query)}&entity=album`;
    }
}

// Turns an iTunes API result into the same shape renderList/showDetail expect from MusicBrainz
function normalizeItunesResult(r) {
    return {
        title: r.collectionName,
        id: r.collectionId,
        date: r.releaseDate,
        "artist-credit": [{ artist: { name: r.artistName } }],
        _source: "itunes",
        _artworkUrl: r.artworkUrl100
    };
}

// iTunes gives low-res (100x100) art by default; bump it up
function getHighResArtwork(url) {
    if (!url) return null;
    return url.replace(/\d+x\d+bb/, "600x600bb");
}

async function searchAlbum() {
    const url = await getURLfromType();
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        if (window.searchType === "ID") {
            document.getElementById("results").innerHTML = '';
            showDetail(data);
            return;
        }

        renderList(data.releases?.slice(0, 10) || [], "results");

        loadMoreResults = () => {
            const currentCount = document.getElementById("results").children.length;
            renderList(data.releases?.slice(0, currentCount + 10) || [], "results");
        }
        document.getElementById("hiddenButtons").innerHTML = "<button id='loadMoreBtn'>Load More Results</button>";
        document.getElementById("loadMoreBtn").addEventListener("click", loadMoreResults);

    } catch (error) {
        console.error("Error fetching album data:", error);
        document.getElementById("results").textContent = "Error fetching album data. Please try again.";
    }
}

async function searchAlbumItunes() {
    const url = await getURLfromTypeItunes();
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        const normalized = (data.results || []).map(normalizeItunesResult);

        if (window.searchTypeItunes === "ID") {
            document.getElementById("resultsItunes").innerHTML = '';
            if (normalized[0]) showDetail(normalized[0]);
            return;
        }

        renderList(normalized.slice(0, 10), "resultsItunes");

        loadMoreResultsItunes = () => {
            const currentCount = document.getElementById("resultsItunes").children.length;
            renderList(normalized.slice(0, currentCount + 10), "resultsItunes");
        }
        document.getElementById("hiddenButtonsItunes").innerHTML = "<button id='loadMoreBtnItunes'>Load More Results</button>";
        document.getElementById("loadMoreBtnItunes").addEventListener("click", loadMoreResultsItunes);

    } catch (error) {
        console.error("Error fetching album data from iTunes:", error);
        document.getElementById("resultsItunes").textContent = "Error fetching album data. Please try again.";
    }
}

// Shared between MusicBrainz and iTunes results — takes a target list id now
function renderList(releases, listElementId = "results") {
    const list = document.getElementById(listElementId);
    detailDiv = document.getElementById("detail");
    detailDiv.innerHTML = "";
    list.innerHTML = "";

    if (releases.length === 0) {
        list.innerHTML = "<li>No results found.</li>";
        return;
    }

    releases.forEach(release => {
        const li = document.createElement("li");
        const artist = release["artist-credit"]?.[0]?.artist?.name || "Unknown Artist";
        li.innerHTML = `<span class="hover-highlight"><b>${release.title}</b> <span id="subtle"> — ${artist} (${release.date?.slice(0, 4) || "?"})</span></span>`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => showDetail(release));
        list.appendChild(li);
    });
}

async function getTracklist(release) {
    if (release._source === "itunes") {
        return await getTracklistItunes(release);
    }

    releaseId = release.id;
    const url = `${BASE_URL}/release/${releaseId}?inc=recordings&fmt=json`;

    const response = await fetch(url);
    const data = await response.json();

    const tracks = data.media?.[0]?.tracks || [];

    return tracks.map(track => ({
        number: track.position,
        title: track.title,
    }));
}

async function getTracklistItunes(release) {
    const url = `${ITUNES_BASE_URL}/lookup?id=${release.id}&entity=song`;
    const response = await fetch(url);
    const data = await response.json();

    // First result in an entity=song lookup is the collection itself; the rest are tracks
    const tracks = (data.results || []).filter(r => r.wrapperType === "track");

    return tracks
        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
        .map(track => ({
            number: track.trackNumber,
            title: track.trackName
        }));
}

async function showDetail(release) {
    const detail = document.getElementById("detail");
    const tracklist = document.getElementById("tracklistPreview");
    const artist = release["artist-credit"]?.[0]?.artist?.name || "Unknown Artist";
    const year = release.date?.slice(0, 4) || "Unknown Year";
    const altCoverCC = new URL('../assets/alt cover cc.png', document.baseURI).href;

    detail.innerHTML = `
        <h2>${release.title}</h2>
        <br>
        <p id="coverStatus"><img src="${altCoverCC}" alt="Album cover" style="width:245px; height:245px; object-fit:cover;"></p>
        <br>
        <p><strong>Artist:</strong> ${artist}</p>
        <p><strong>Year:</strong> ${year}</p>
        <br>
        <button id='createPage'>Create Page</button>
    `;

    const tracks = await getTracklist(release);
    const tracklistHTML = tracks.map(t => `<li>${t.title}</li>`).join("");
    tracklist.innerHTML = `<h3>Tracklist</h3><ol id="tracklistList">${tracklistHTML}</ol>`;

    //smooth scroll
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });

    //if it's iTunes, get cover art from iTunes, else (meaning it's MusicBrainz) get it from Cover Art Archive
    if (release._source === "itunes") {
        const artworkUrl = getHighResArtwork(release._artworkUrl);
        document.getElementById("coverStatus").innerHTML = artworkUrl
            ? `<img src="${artworkUrl}" alt="Album Cover" style="width:245px; height:245px; object-fit:cover;">`
            : `${NO_COVER}" alt="No Cover Found" style="width:245px; height:245px; object-fit:cover;">`;
    }
    else {
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
    }

    //create the createPage button listener to move onto the next step
    document.getElementById("createPage").addEventListener("click", () => createAlbumPage(release, artist, year, tracks));
}

//gets details of the album -- performs askPageInfo to get info from user
async function createAlbumPage(release, artist, year, tracks) {
    const title = release.title;
    let cover;

    if (release._source === "itunes") {
        cover = getHighResArtwork(release._artworkUrl) || NO_COVER;
    } else {
        try {
            const coverResponse = await fetch(`${COVER_URL}/${release.id}/front`);
            if (coverResponse.ok) {
                cover = "https://coverartarchive.org/release/" + release.id + "/front";
            } else {
                cover = NO_COVER;
            }
        } catch { cover = NO_COVER; }
    }

    const sanitizedTitle = title.replace(/[/\\:*?"<>|]/g, '-');

    albuminfo = await askPageInfo(sanitizedTitle, title, artist, year, cover, tracks);

    const info = await askPageInfo(sanitizedTitle, title, artist, year, cover, tracks);

    if (info && info.url) {
        window.location.href = info.url;
    }
}

async function loadAlbumList() {
    const filesObj = await api.getAlbumPages();
    const topBanner = document.getElementById("topBanner");

    topBanner.innerHTML = `<span class="pageTabSearch"><svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="#FFFFFF"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg> Search</span><span class="fakeBorder"></span>`;

    if (filesObj.length === 0) return;

    filesObj.forEach(filePair => {
        const item = document.createElement('a');
        item.classList.add("pageTab");
        item.textContent = filePair.sanitizedTitle.replaceAll(".html", "");
        item.href = filePair.url;

        const fakeBorder = document.createElement('span');
        fakeBorder.classList.add("fakeBorder");

        topBanner.appendChild(item);
        topBanner.appendChild(fakeBorder);
    })
}

//ask user for page info -- returns a promise that resolves to the albuminfo object
function askPageInfo(sanitizedTitle, title, artist, year, cover, tracks) {
    //initialize all fields
    const sanitizedTitleInput = document.getElementById("sanitizedTitleInput");
    const titleInput = document.getElementById("titleInput");
    const artistInput = document.getElementById("artistInput");
    const yearInput = document.getElementById("yearInput");
    const miniCover = document.getElementById("miniCover");
    const errorMessage = document.getElementById("errorMessage");

    //connects all values to respective variables (for the pre-filled values)
    sanitizedTitleInput.value = sanitizedTitle;
    titleInput.value = title;
    artistInput.value = artist;
    yearInput.value = (year != "Unknown Year") ? year : '';

    document.getElementById("albumInfoForm").style.display = "flex";
    miniCover.src = cover;

    //checks if user types any banned characters in the sanitized title input field, and if so, displays an error message
    sanitizedTitleInput.addEventListener('input', function() {
        const specialCharRegex = /[^a-zA-Z0-9_ -]/;
        errorMessage.textContent = specialCharRegex.test(sanitizedTitleInput.value)
            ? "No special characters allowed in the filename." : "";
    })

    //i lowk forgot what this does but it makes the button work
    const oldBtn = document.getElementById("createPageAfterValidationBtn");
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);

    //autoscroll
    window.scrollTo({
  top: document.body.scrollHeight,
  behavior: 'smooth'
    });

    //creates the album page with all the collected info
    //creates the album page with all the collected info
    return new Promise((resolve) => {
    newBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const FsanitizedTitle = sanitizedTitleInput.value;
        const Ftitle = titleInput.value;
        const Fartist = artistInput.value;
        const Fyear = yearInput.value;

        if (FsanitizedTitle && Ftitle && cover && Fartist && Fyear) {
            const albuminfo = { sanitizedTitle: FsanitizedTitle, title: Ftitle, cover: cover, artist: Fartist, year: Fyear, tracks: tracks };
            const result = await api.createAlbumPage(albuminfo);

            if (result && result.success) {
                await loadAlbumList();   // now the new album is in the index
                resolve(result);
            } else {
                errorMessage.textContent = "Couldn't save the album page. Check the terminal for errors.";
            }
        } else {
            errorMessage.textContent = "Please fill in every field.";
        }
    });
});

}

loadAlbumList();

function switchSearchMode(mode) {

    //Get the two sections as elements
    console.log("Search Switch Read: " + mode);
    const itunesSection = document.getElementById("iTunesSearch");
    const musicBrainzSection = document.getElementById("musicBrainzSearch");

    //if itunes inputted, close musicbrainz and open itunes, else do the opposite
    if (mode == "itunes") {
        console.log("switched iTunes");
        itunesSection.style.display = "block";
        musicBrainzSection.style.display = "none";
    }
    else if (mode == "musicbrainz") {
        console.log("switched musicBrainz");
        itunesSection.style.display = "none";
        musicBrainzSection.style.display = "block";
    }

    //itunesSection.style.display = (mode === "itunes") ? "block" : "none";
    //musicBrainzSection.style.display = (mode === "musicbrainz") ? "block" : "none";
}


// all the event listeners for every button, read the button name and you'll figure it out
document.getElementById("switchtoiTunes").addEventListener("click", () => switchSearchMode("itunes"));
document.getElementById("switchtoMusicBrainz").addEventListener("click", () => switchSearchMode("musicbrainz"));

document.getElementById("albumSearchBtn").addEventListener("click", searchAlbum);
document.getElementById("searchToggleBtn-Title").addEventListener("click", () => changeSearchType("Title"));
document.getElementById("searchToggleBtn-ID").addEventListener("click", () => changeSearchType("ID"));

document.getElementById("albumSearchBtnItunes").addEventListener("click", searchAlbumItunes);
document.getElementById("searchToggleBtn-Title-Itunes").addEventListener("click", () => changeSearchTypeItunes("Title"));
document.getElementById("searchToggleBtn-ID-Itunes").addEventListener("click", () => changeSearchTypeItunes("ID"));