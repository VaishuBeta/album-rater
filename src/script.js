console.log("Hello world.");

const title_el = document.getElementById("title");

title_el.innerText = api.title;

//Get the elements to create album
const album_title_el = document.getElementById("albumTitle");
const album_content_el = document.getElementById("albumContent");
const album_submit_el = document.getElementById("albumSubmit");

album_submit_el.addEventListener("click", async () => {
    const title = album_title_el.value;
    const content = album_content_el.value;
    console.log('Button pressed, info recieved. Title: ' + title + ' Content: ' + content);

    api.createAlbumPageOld({title, content})

    //Reset values after creating
    album_title_el.value = "";
    album_content_el.value = "";

});