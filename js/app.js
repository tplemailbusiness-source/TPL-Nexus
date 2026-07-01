const dom = {
    audio:document.getElementById("audio"),
    play:document.getElementById("play"),
    prev:document.getElementById("prev"),
    next:document.getElementById("next"),
    shuffle:document.getElementById("shuffle"),
    repeat:document.getElementById("repeat"),
    progress:document.getElementById("progress"),
    volume:document.getElementById("volume"),
    cover:document.getElementById("cover"),
    title:document.getElementById("title"),
    artist:document.getElementById("artist"),
    album:document.getElementById("album"),
    currentTime:document.getElementById("currentTime"),
    remainingTime:document.getElementById("remainingTime"),
    search:document.getElementById("search"),
    greeting:document.getElementById("greeting"),
    pageTitle:document.getElementById("pageTitle"),
    pageSurface:document.getElementById("pageSurface"),
    playerShell:document.getElementById("playerShell"),
    favoriteCurrent:document.getElementById("favoriteCurrent"),
    libraryCurrent:document.getElementById("libraryCurrent"),
    lyricsToggle:document.getElementById("lyricsToggle"),
    lyricsCarousel:document.getElementById("lyricsCarousel"),
    lyricsStatus:document.getElementById("lyricsStatus"),
    cinematicToggle:document.getElementById("cinematicToggle"),
    cinematicMode:document.getElementById("cinematicMode"),
    cinematicClose:document.getElementById("cinematicClose"),
    cinematicCover:document.getElementById("cinematicCover"),
    cinematicAlbum:document.getElementById("cinematicAlbum"),
    cinematicTitle:document.getElementById("cinematicTitle"),
    cinematicArtist:document.getElementById("cinematicArtist"),
    cinematicLyrics:document.getElementById("cinematicLyrics"),
    expandPlayer:document.getElementById("expandPlayer"),
    drawerToggle:document.getElementById("drawerToggle"),
    drawerScrim:document.getElementById("drawerScrim")
};

const storageKeys = {
    library:"tpl-nexus-library",
    favorites:"tpl-nexus-favorites",
    settings:"tpl-nexus-settings",
    history:"tpl-nexus-history",
    playback:"tpl-nexus-playback"
};

const defaultTheme = {
    primary:"#0f2b63",
    secondary:"#103f6f",
    accent:"#20d6df"
};

const defaultSettings = {
    animatedBackground:true,
    reduceMotion:false,
    lyricsSize:"medium"
};

const app = {
    songs:[],
    page:"home",
    currentSong:0,
    playing:false,
    shuffle:false,
    repeat:false,
    lyricsVisible:false,
    activeLyric:-1,
    library:new Set(),
    favorites:new Set(),
    history:[],
    settings:{...defaultSettings}
};

function readJSON(key,fallback){
    try{
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    }catch(error){
        return fallback;
    }
}

function writeJSON(key,value){
    localStorage.setItem(key,JSON.stringify(value));
}

function songId(song){
    return [song.title,song.artist,song.album].join("::").toLowerCase().replace(/\s+/g,"-");
}

function escapeText(value = ""){
    return String(value).replace(/[&<>"']/g,(character)=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        "\"":"&quot;",
        "'":"&#039;"
    }[character]));
}

function setGreeting(){
    const hour = new Date().getHours();
    dom.greeting.textContent = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

async function init(){
    setGreeting();
    hydrateState();

    const response = await fetch("data/songs.json");
    const data = await response.json();
    app.songs = (data.songs || []).map((song,index)=>({
        ...song,
        id:song.id || songId(song),
        index
    }));

    if(!app.songs.length){
        dom.pageSurface.innerHTML = `<div class="emptyState"><h3>No songs found</h3><p>Add tracks to data/songs.json to start listening.</p></div>`;
        return;
    }

    const savedPlayback = readJSON(storageKeys.playback,null);
    const savedIndex = app.songs.findIndex((song)=>song.id === savedPlayback?.songId);
    app.currentSong = savedIndex >= 0 ? savedIndex : 0;

    dom.audio.volume = Number.isFinite(savedPlayback?.volume) ? savedPlayback.volume : 0.9;
    dom.volume.value = dom.audio.volume;

    applySettings();
    loadSong(app.currentSong,{ resumeTime:savedPlayback?.position || 0, animate:false });
    renderPage();
    registerServiceWorker();
}

function hydrateState(){
    app.library = new Set(readJSON(storageKeys.library,[]));
    app.favorites = new Set(readJSON(storageKeys.favorites,[]));
    app.history = readJSON(storageKeys.history,[]);
    app.settings = {
        ...defaultSettings,
        ...readJSON(storageKeys.settings,{})
    };
}

function persistCollection(key,set){
    writeJSON(key,[...set]);
}

function persistPlayback(){
    const song = app.songs[app.currentSong];
    if(!song) return;

    writeJSON(storageKeys.playback,{
        songId:song.id,
        position:dom.audio.currentTime || 0,
        volume:dom.audio.volume || 0.9
    });
}

function rememberPlayed(song){
    app.history = [song.id,...app.history.filter((id)=>id !== song.id)].slice(0,12);
    writeJSON(storageKeys.history,app.history);
}

function applySettings(){
    document.body.classList.toggle("ambientOff",!app.settings.animatedBackground);
    document.body.classList.toggle("reduceMotion",app.settings.reduceMotion);
    document.body.dataset.lyricsSize = app.settings.lyricsSize;
    writeJSON(storageKeys.settings,app.settings);
}

function setPage(page){
    app.page = page;
    dom.pageTitle.textContent = page[0].toUpperCase() + page.slice(1);
    document.querySelectorAll(".navItem").forEach((item)=>{
        item.classList.toggle("active",item.dataset.page === page);
    });
    document.body.classList.remove("drawerOpen");
    renderPage();
}

function filteredSongs(sourceSongs = app.songs){
    const query = dom.search.value.trim().toLowerCase();
    if(!query) return sourceSongs;

    return sourceSongs.filter((song)=>{
        return `${song.title} ${song.artist} ${song.album}`.toLowerCase().includes(query);
    });
}

function renderPage(){
    if(!app.songs.length) return;

    const pageRenderers = {
        home:renderHome,
        library:renderLibrary,
        albums:renderAlbums,
        artists:renderArtists,
        favorites:renderFavorites,
        settings:renderSettings
    };

    dom.pageSurface.innerHTML = "";
    dom.pageSurface.appendChild(pageRenderers[app.page]?.() || renderHome());
    updateActionStates();
}

function createView(){
    const view = document.createElement("div");
    view.className = "view";
    return view;
}

function renderHome(){
    const view = createView();
    const recent = app.history.map((id)=>app.songs.find((song)=>song.id === id)).filter(Boolean);
    const random = [...app.songs].sort(()=>Math.random() - .5).slice(0,4);
    const recentlyAdded = [...app.songs].slice(-4).reverse();

    view.innerHTML = `
        <div class="heroBand">
            <div class="heroCopy">
                <p class="eyebrow">${dom.greeting.textContent}</p>
                <h3>Private music, cinematic space.</h3>
                <p>All uploaded songs live here first. Build your Library and Favorites manually while the player keeps your place.</p>
            </div>
            <div class="heroStats">
                <div class="statPanel"><p class="sectionKicker">Uploaded</p><strong>${app.songs.length}</strong></div>
                <div class="statPanel"><p class="sectionKicker">Library</p><strong>${app.library.size}</strong></div>
                <div class="statPanel"><p class="sectionKicker">Favorites</p><strong>${app.favorites.size}</strong></div>
            </div>
        </div>
    `;

    view.appendChild(renderSongSection("Continue Listening",recent.length ? recent : [app.songs[app.currentSong]],"Resume from your latest plays"));
    view.appendChild(renderSongTiles("Recently Added",recentlyAdded));
    view.appendChild(renderSongTiles("Random Picks",random));
    view.appendChild(renderSongSection("All Uploaded Songs",filteredSongs(app.songs),"Home includes every uploaded track"));

    return view;
}

function renderLibrary(){
    const librarySongs = app.songs.filter((song)=>app.library.has(song.id));
    const view = createView();
    view.appendChild(renderSongSection("Library",filteredSongs(librarySongs),"Only songs you manually add appear here",true));
    return view;
}

function renderFavorites(){
    const favoriteSongs = app.songs.filter((song)=>app.favorites.has(song.id));
    const view = createView();
    view.appendChild(renderSongSection("Favorites",filteredSongs(favoriteSongs),"Favorites stay separate from your Library",true));
    return view;
}

function renderAlbums(){
    const view = createView();
    const albums = getAlbums().filter((album)=>{
        const query = dom.search.value.trim().toLowerCase();
        return !query || `${album.title} ${album.artist}`.toLowerCase().includes(query);
    });

    view.innerHTML = sectionHeaderHTML("Albums",`${albums.length} albums`,"Large artwork collections");

    const grid = document.createElement("div");
    grid.className = "albumGrid";
    albums.forEach((album)=>{
        const card = document.createElement("button");
        card.className = "albumCard";
        card.innerHTML = `
            <img src="${album.cover}" alt="${escapeText(album.title)} cover" loading="lazy">
            <h4>${escapeText(album.title)}</h4>
            <p>${escapeText(album.artist)} · ${album.songs.length} ${album.songs.length === 1 ? "song" : "songs"}</p>
        `;
        card.addEventListener("click",()=>renderAlbumDetail(album));
        grid.appendChild(card);
    });

    view.appendChild(grid);
    return view;
}

function renderAlbumDetail(album){
    dom.pageTitle.textContent = album.title;
    const view = createView();
    view.innerHTML = `
        <div class="heroBand">
            <div class="heroCopy">
                <p class="eyebrow">Album</p>
                <h3>${escapeText(album.title)}</h3>
                <p>${escapeText(album.artist)} · ${album.songs.length} ${album.songs.length === 1 ? "track" : "tracks"}</p>
                <button class="pillButton" data-action="play-album" data-song-id="${album.songs[0].id}">Play Album</button>
            </div>
            <div class="statPanel"><img src="${album.cover}" alt="${escapeText(album.title)} cover" style="width:100%;border-radius:22px"></div>
        </div>
    `;
    view.appendChild(renderSongSection("Track List",album.songs,"Album songs"));
    dom.pageSurface.innerHTML = "";
    dom.pageSurface.appendChild(view);
}

function renderArtists(){
    const view = createView();
    const artists = getArtists().filter((artist)=>{
        const query = dom.search.value.trim().toLowerCase();
        return !query || artist.name.toLowerCase().includes(query);
    });

    view.innerHTML = sectionHeaderHTML("Artists",`${artists.length} artists`,"Browse by performer");

    const grid = document.createElement("div");
    grid.className = "artistGrid";
    artists.forEach((artist)=>{
        const initials = artist.name.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase();
        const card = document.createElement("button");
        card.className = "artistCard";
        card.innerHTML = `
            <div class="artistAvatar">${escapeText(initials)}</div>
            <h4>${escapeText(artist.name)}</h4>
            <p>${artist.albums.length} ${artist.albums.length === 1 ? "album" : "albums"} · ${artist.songs.length} ${artist.songs.length === 1 ? "song" : "songs"}</p>
        `;
        card.addEventListener("click",()=>renderArtistDetail(artist));
        grid.appendChild(card);
    });

    view.appendChild(grid);
    return view;
}

function renderArtistDetail(artist){
    dom.pageTitle.textContent = artist.name;
    const view = createView();
    view.innerHTML = `
        <div class="heroBand">
            <div class="heroCopy">
                <p class="eyebrow">Artist</p>
                <h3>${escapeText(artist.name)}</h3>
                <p>${artist.albums.length} ${artist.albums.length === 1 ? "album" : "albums"} and ${artist.songs.length} ${artist.songs.length === 1 ? "song" : "songs"} in TPL Nexus.</p>
            </div>
            <div class="statPanel"><p class="sectionKicker">Albums</p><strong>${artist.albums.length}</strong></div>
        </div>
    `;
    view.appendChild(renderSongSection("Songs",artist.songs,"Songs by this artist"));
    dom.pageSurface.innerHTML = "";
    dom.pageSurface.appendChild(view);
}

function renderSettings(){
    const view = createView();
    view.innerHTML = `
        <div class="heroCopy" style="margin-bottom:18px">
            <p class="eyebrow">Settings</p>
            <h3>Make Nexus feel right.</h3>
            <p>Personal preferences are saved on this device.</p>
        </div>
        <div class="settingsGrid">
            ${settingsRow("Animated Background","Keep the ambient gradients slowly moving.","animatedBackground",app.settings.animatedBackground)}
            ${settingsRow("Reduce Motion","Minimize movement across the interface.","reduceMotion",app.settings.reduceMotion)}
            <div class="settingsRow">
                <div><strong>Lyrics Size</strong><p>Choose the Beat by Beat lyric scale.</p></div>
                <div class="songActions">
                    <button data-setting-size="small" aria-pressed="${app.settings.lyricsSize === "small"}">S</button>
                    <button data-setting-size="medium" aria-pressed="${app.settings.lyricsSize === "medium"}">M</button>
                    <button data-setting-size="large" aria-pressed="${app.settings.lyricsSize === "large"}">L</button>
                </div>
            </div>
            <div class="settingsRow"><div><strong>Clear Favorites</strong><p>Remove all favorited songs from this device.</p></div><button class="pillButton" data-clear="favorites">Clear</button></div>
            <div class="settingsRow"><div><strong>Clear Library</strong><p>Remove manually added Library songs from this device.</p></div><button class="pillButton" data-clear="library">Clear</button></div>
            <div class="settingsRow"><div><strong>Clear History</strong><p>Reset Continue Listening and recently played.</p></div><button class="pillButton" data-clear="history">Clear</button></div>
            <div class="settingsRow"><div><strong>Theme</strong><p>Future support for custom app themes.</p></div><button class="pillButton" disabled>Future</button></div>
        </div>
    `;
    return view;
}

function settingsRow(title,description,key,value){
    return `
        <div class="settingsRow">
            <div><strong>${title}</strong><p>${description}</p></div>
            <button class="switch" data-setting="${key}" aria-label="${title}" aria-pressed="${value}"></button>
        </div>
    `;
}

function sectionHeaderHTML(title,count,kicker){
    return `
        <div class="sectionHeader">
            <div><p class="sectionKicker">${kicker}</p><h3>${title}</h3></div>
            <span>${count}</span>
        </div>
    `;
}

function renderSongTiles(title,songs){
    const section = document.createElement("section");
    section.innerHTML = sectionHeaderHTML(title,`${songs.length} songs`,"Discovery");
    const grid = document.createElement("div");
    grid.className = "tileGrid";
    songs.forEach((song)=>grid.appendChild(songTile(song)));
    section.appendChild(grid);
    return section;
}

function songTile(song){
    const card = document.createElement("button");
    card.className = "albumCard";
    card.dataset.songId = song.id;
    card.innerHTML = `
        <img src="${song.cover}" alt="${escapeText(song.album || song.title)} cover" loading="lazy">
        <h4>${escapeText(song.title)}</h4>
        <p>${escapeText(song.artist)}</p>
    `;
    card.addEventListener("click",()=>playSongById(song.id));
    return card;
}

function renderSongSection(title,songs,kicker,showEmpty = false){
    const section = document.createElement("section");
    section.innerHTML = sectionHeaderHTML(title,`${songs.length} ${songs.length === 1 ? "song" : "songs"}`,kicker);

    if(!songs.length && showEmpty){
        const empty = document.createElement("div");
        empty.className = "emptyState";
        empty.innerHTML = `<h3>Nothing here yet.</h3><p>Add songs from Home or tap the heart to build this page.</p>`;
        section.appendChild(empty);
        return section;
    }

    const list = document.createElement("div");
    list.className = "songList";
    songs.forEach((song)=>list.appendChild(songRow(song)));
    section.appendChild(list);
    return section;
}

function songRow(song){
    const row = document.createElement("div");
    row.className = `songCard ${song.index === app.currentSong ? "playing" : ""}`;
    row.innerHTML = `
        <button class="songInfo" data-action="play" data-song-id="${song.id}">
            <img src="${song.cover}" alt="${escapeText(song.album || song.title)} cover" loading="lazy">
            <div>
                <div class="songTitle">${escapeText(song.title)}</div>
                <div class="songArtist">${escapeText(song.artist)}</div>
                <div class="songAlbum">${escapeText(song.album)}</div>
            </div>
        </button>
        <div class="songActions">
            <button data-action="library" data-song-id="${song.id}" aria-label="${app.library.has(song.id) ? "Remove from Library" : "Add to Library"}" aria-pressed="${app.library.has(song.id)}">
                <span class="material-symbols-rounded">${app.library.has(song.id) ? "library_add_check" : "library_add"}</span>
            </button>
            <button data-action="favorite" data-song-id="${song.id}" aria-label="${app.favorites.has(song.id) ? "Unfavorite" : "Favorite"}" aria-pressed="${app.favorites.has(song.id)}">
                <span class="material-symbols-rounded">favorite</span>
            </button>
        </div>
    `;
    return row;
}

function getAlbums(){
    const map = new Map();
    app.songs.forEach((song)=>{
        const key = `${song.album}::${song.artist}`;
        if(!map.has(key)){
            map.set(key,{
                title:song.album || "Unknown Album",
                artist:song.artist || "Unknown Artist",
                cover:song.cover,
                songs:[]
            });
        }
        map.get(key).songs.push(song);
    });
    return [...map.values()];
}

function getArtists(){
    const map = new Map();
    app.songs.forEach((song)=>{
        if(!map.has(song.artist)){
            map.set(song.artist,{
                name:song.artist || "Unknown Artist",
                songs:[],
                albums:[]
            });
        }
        const artist = map.get(song.artist);
        artist.songs.push(song);
        if(!artist.albums.includes(song.album)){
            artist.albums.push(song.album);
        }
    });
    return [...map.values()];
}

function playSongById(id){
    const index = app.songs.findIndex((song)=>song.id === id);
    if(index < 0) return;

    loadSong(index,{ autoplay:true });
    renderPage();
}

function loadSong(index,options = {}){
    const song = app.songs[index];
    if(!song) return;

    app.currentSong = index;
    app.activeLyric = -1;
    dom.playerShell.classList.add("songChanging");

    window.setTimeout(()=>{
        dom.title.textContent = song.title;
        dom.artist.textContent = song.artist;
        dom.album.textContent = song.album || "Now Playing";
        dom.cover.src = song.cover;
        dom.cover.alt = `${song.album || song.title} cover`;
        dom.cinematicCover.src = song.cover;
        dom.cinematicAlbum.textContent = song.album || "Now Playing";
        dom.cinematicTitle.textContent = song.title;
        dom.cinematicArtist.textContent = song.artist;
        dom.audio.src = song.file;

        if(options.resumeTime){
            dom.audio.addEventListener("loadedmetadata",()=>{
                dom.audio.currentTime = Math.min(options.resumeTime,dom.audio.duration || options.resumeTime);
            },{ once:true });
        }

        dom.progress.value = 0;
        dom.currentTime.textContent = "0:00";
        dom.remainingTime.textContent = "-0:00";

        applyTheme(song.theme);
        renderLyrics(song.lyrics);
        updateLyrics(0,true);
        updateActionStates();
        rememberPlayed(song);
        persistPlayback();

        window.setTimeout(()=>dom.playerShell.classList.remove("songChanging"),240);

        if(options.autoplay){
            startPlayback();
        }else{
            setPlaying(false);
        }
    },options.animate === false ? 0 : 180);
}

function applyTheme(theme = {}){
    const nextTheme = {...defaultTheme,...theme};
    document.documentElement.style.setProperty("--primary",nextTheme.primary);
    document.documentElement.style.setProperty("--secondary",nextTheme.secondary);
    document.documentElement.style.setProperty("--accent",nextTheme.accent);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",nextTheme.primary);
}

function setPlaying(isPlaying){
    app.playing = isPlaying;
    dom.play.innerHTML = `<span class="material-symbols-rounded">${isPlaying ? "pause" : "play_arrow"}</span>`;
    dom.play.setAttribute("aria-label",isPlaying ? "Pause" : "Play");
}

async function startPlayback(){
    try{
        await dom.audio.play();
        setPlaying(true);
    }catch(error){
        setPlaying(false);
    }
}

function nextSong(){
    if(app.repeat){
        dom.audio.currentTime = 0;
        startPlayback();
        return;
    }

    const nextIndex = app.shuffle
        ? Math.floor(Math.random() * app.songs.length)
        : (app.currentSong + 1) % app.songs.length;

    loadSong(nextIndex,{ autoplay:true });
    renderPage();
}

function previousSong(){
    const previousIndex = app.currentSong === 0 ? app.songs.length - 1 : app.currentSong - 1;
    loadSong(previousIndex,{ autoplay:true });
    renderPage();
}

function formatTime(seconds){
    if(!Number.isFinite(seconds)){
        return "0:00";
    }
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const remainingSeconds = Math.floor(Math.abs(seconds) % 60).toString().padStart(2,"0");
    return `${minutes}:${remainingSeconds}`;
}

function updateTime(){
    dom.progress.max = dom.audio.duration || 0;
    dom.progress.value = dom.audio.currentTime || 0;
    dom.currentTime.textContent = formatTime(dom.audio.currentTime);
    dom.remainingTime.textContent = `-${formatTime((dom.audio.duration || 0) - (dom.audio.currentTime || 0))}`;
    updateLyrics(dom.audio.currentTime || 0);
    persistPlayback();
}

function renderLyrics(lyrics = []){
    if(!lyrics.length){
        dom.lyricsCarousel.innerHTML = `<p class="emptyLyrics">No lyrics have been added for this song yet.</p>`;
        dom.lyricsToggle.disabled = true;
        dom.lyricsToggle.setAttribute("aria-label","Lyrics unavailable");
        dom.lyricsStatus.textContent = "No lyrics";
        setLyricsVisible(false);
        return;
    }

    dom.lyricsToggle.disabled = false;
    dom.lyricsToggle.setAttribute("aria-label",app.lyricsVisible ? "Hide lyrics" : "Show lyrics");
    dom.lyricsStatus.textContent = app.lyricsVisible ? "Following" : "Lyrics off";
    dom.lyricsCarousel.innerHTML = "";

    const track = document.createElement("div");
    track.className = "lyricsTrack";
    lyrics.forEach((line,index)=>{
        const lyricLine = document.createElement("div");
        lyricLine.className = "lyricLine";
        lyricLine.dataset.index = index;
        lyricLine.textContent = line.text;
        track.appendChild(lyricLine);
    });
    dom.lyricsCarousel.appendChild(track);
}

function setLyricsVisible(isVisible){
    app.lyricsVisible = isVisible;
    dom.playerShell.classList.toggle("lyricsOpen",isVisible);
    dom.lyricsToggle.setAttribute("aria-pressed",String(isVisible));
    dom.lyricsToggle.setAttribute("aria-label",isVisible ? "Hide lyrics" : "Show lyrics");
    dom.lyricsStatus.textContent = isVisible ? "Following" : "Lyrics off";

    if(isVisible){
        updateLyrics(dom.audio.currentTime || 0,true);
    }
}

function getActiveLyricIndex(lyrics,time){
    if(!lyrics.length) return -1;
    return lyrics.reduce((active,line,index)=>time >= line.time ? index : active,0);
}

function updateLyrics(time,force = false){
    const lyrics = app.songs[app.currentSong]?.lyrics || [];
    if(!lyrics.length) return;

    const nextActive = getActiveLyricIndex(lyrics,time);
    if(!force && nextActive === app.activeLyric) return;

    app.activeLyric = nextActive;
    const lines = dom.lyricsCarousel.querySelectorAll(".lyricLine");
    const track = dom.lyricsCarousel.querySelector(".lyricsTrack");

    lines.forEach((line,index)=>{
        line.classList.toggle("past",index < app.activeLyric);
        line.classList.toggle("active",index === app.activeLyric);
    });

    const activeLine = lines[app.activeLyric];
    if(track && activeLine && app.lyricsVisible){
        const carouselCenter = dom.lyricsCarousel.clientHeight / 2;
        const lineCenter = activeLine.offsetTop + (activeLine.offsetHeight / 2);
        track.style.transform = `translateY(${carouselCenter - lineCenter}px)`;
    }

    dom.cinematicLyrics.textContent = activeLine?.textContent || "";
}

function updateActionStates(){
    const song = app.songs[app.currentSong];
    if(!song) return;

    dom.favoriteCurrent.setAttribute("aria-pressed",String(app.favorites.has(song.id)));
    dom.libraryCurrent.setAttribute("aria-pressed",String(app.library.has(song.id)));
    dom.favoriteCurrent.setAttribute("aria-label",app.favorites.has(song.id) ? "Unfavorite current song" : "Favorite current song");
    dom.libraryCurrent.setAttribute("aria-label",app.library.has(song.id) ? "Remove current song from Library" : "Add current song to Library");
    dom.libraryCurrent.innerHTML = `<span class="material-symbols-rounded">${app.library.has(song.id) ? "library_add_check" : "library_add"}</span>`;
}

function toggleFavorite(id = app.songs[app.currentSong]?.id){
    if(!id) return;
    app.favorites.has(id) ? app.favorites.delete(id) : app.favorites.add(id);
    persistCollection(storageKeys.favorites,app.favorites);
    renderPage();
    updateActionStates();
}

function toggleLibrary(id = app.songs[app.currentSong]?.id){
    if(!id) return;
    app.library.has(id) ? app.library.delete(id) : app.library.add(id);
    persistCollection(storageKeys.library,app.library);
    renderPage();
    updateActionStates();
}

function clearCollection(type){
    if(type === "favorites"){
        app.favorites.clear();
        persistCollection(storageKeys.favorites,app.favorites);
    }
    if(type === "library"){
        app.library.clear();
        persistCollection(storageKeys.library,app.library);
    }
    if(type === "history"){
        app.history = [];
        writeJSON(storageKeys.history,app.history);
        localStorage.removeItem(storageKeys.playback);
    }
    renderPage();
    updateActionStates();
}

function openCinematicMode(){
    dom.cinematicMode.classList.add("open");
    dom.cinematicMode.setAttribute("aria-hidden","false");
    updateLyrics(dom.audio.currentTime || 0,true);
}

function closeCinematicMode(){
    dom.cinematicMode.classList.remove("open");
    dom.cinematicMode.setAttribute("aria-hidden","true");
}

function registerServiceWorker(){
    // Service worker temporarily disabled while developing
}

document.querySelectorAll(".navItem").forEach((item)=>{
    item.addEventListener("click",()=>setPage(item.dataset.page));
});

dom.pageSurface.addEventListener("click",(event)=>{
    const button = event.target.closest("button");
    if(!button) return;

    const action = button.dataset.action;
    const songId = button.dataset.songId;

    if(action === "play" || action === "play-album"){
        playSongById(songId);
    }
    if(action === "favorite"){
        toggleFavorite(songId);
    }
    if(action === "library"){
        toggleLibrary(songId);
    }
    if(button.dataset.setting){
        app.settings[button.dataset.setting] = !app.settings[button.dataset.setting];
        applySettings();
        renderPage();
    }
    if(button.dataset.settingSize){
        app.settings.lyricsSize = button.dataset.settingSize;
        applySettings();
        renderPage();
    }
    if(button.dataset.clear){
        clearCollection(button.dataset.clear);
    }
});

dom.search.addEventListener("input",renderPage);
dom.play.addEventListener("click",()=>app.playing ? (dom.audio.pause(),setPlaying(false)) : startPlayback());
dom.next.addEventListener("click",nextSong);
dom.prev.addEventListener("click",previousSong);
dom.shuffle.addEventListener("click",()=>{
    app.shuffle = !app.shuffle;
    dom.shuffle.setAttribute("aria-pressed",String(app.shuffle));
    dom.shuffle.setAttribute("aria-label",app.shuffle ? "Turn shuffle off" : "Turn shuffle on");
});
dom.repeat.addEventListener("click",()=>{
    app.repeat = !app.repeat;
    dom.repeat.setAttribute("aria-pressed",String(app.repeat));
    dom.repeat.setAttribute("aria-label",app.repeat ? "Turn repeat off" : "Turn repeat on");
});
dom.progress.addEventListener("input",()=>{
    dom.audio.currentTime = dom.progress.value;
    updateTime();
});
dom.volume.addEventListener("input",()=>{
    dom.audio.volume = Number(dom.volume.value);
    persistPlayback();
});
dom.audio.addEventListener("timeupdate",updateTime);
dom.audio.addEventListener("loadedmetadata",updateTime);
dom.audio.addEventListener("ended",nextSong);
dom.favoriteCurrent.addEventListener("click",()=>toggleFavorite());
dom.libraryCurrent.addEventListener("click",()=>toggleLibrary());
dom.lyricsToggle.addEventListener("click",()=>{
    if(!dom.lyricsToggle.disabled){
        setLyricsVisible(!app.lyricsVisible);
    }
});
dom.cinematicToggle.addEventListener("click",openCinematicMode);
dom.cinematicClose.addEventListener("click",closeCinematicMode);
dom.expandPlayer.addEventListener("click",()=>dom.playerShell.classList.toggle("expanded"));
dom.drawerToggle.addEventListener("click",()=>document.body.classList.add("drawerOpen"));
dom.drawerScrim.addEventListener("click",()=>document.body.classList.remove("drawerOpen"));

document.addEventListener("keydown",(event)=>{
    if(event.key === "Escape"){
        closeCinematicMode();
        document.body.classList.remove("drawerOpen");
    }
    if(event.code === "Space" && event.target === document.body){
        event.preventDefault();
        dom.play.click();
    }
});

window.addEventListener("beforeunload",persistPlayback);

init();
