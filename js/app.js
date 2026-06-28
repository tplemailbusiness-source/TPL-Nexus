const audio = document.getElementById("audio");
const play = document.getElementById("play");
const prev = document.getElementById("prev");
const next = document.getElementById("next");
const lyricsToggle = document.getElementById("lyricsToggle");
const progress = document.getElementById("progress");

const title = document.getElementById("title");
const artist = document.getElementById("artist");
const album = document.getElementById("album");
const cover = document.getElementById("cover");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

const songList = document.getElementById("songList");
const songCount = document.getElementById("songCount");
const search = document.getElementById("search");
const greeting = document.getElementById("greeting");
const lyricsPanel = document.getElementById("lyricsPanel");
const lyricsCarousel = document.getElementById("lyricsCarousel");
const lyricsStatus = document.getElementById("lyricsStatus");

const defaultTheme = {
    primary: "#0f2b63",
    secondary: "#103f6f",
    accent: "#20d6df"
};

let songs = [];
let currentSong = 0;
let playing = false;
let lyricsVisible = false;
let activeLyric = -1;

async function loadSongs(){
    setGreeting();

    const response = await fetch("data/songs.json");
    const data = await response.json();

    songs = data.songs || [];

    if(!songs.length){
        title.textContent = "No songs found";
        artist.textContent = "Add tracks to data/songs.json";
        return;
    }

    currentSong = Math.floor(Math.random() * songs.length);

    buildLibrary();
    loadSong(currentSong);
}

function setGreeting(){
    const hour = new Date().getHours();

    if(hour < 12){
        greeting.textContent = "Good morning";
    }else if(hour < 18){
        greeting.textContent = "Good afternoon";
    }else{
        greeting.textContent = "Good evening";
    }
}

function buildLibrary(filter = ""){
    const normalizedFilter = filter.trim().toLowerCase();
    let visibleSongs = 0;

    songList.innerHTML = "";

    songs.forEach((song,index)=>{
        const text = `${song.title} ${song.artist} ${song.album}`.toLowerCase();

        if(normalizedFilter && !text.includes(normalizedFilter)){
            return;
        }

        visibleSongs++;

        const card = document.createElement("button");
        card.type = "button";
        card.className = "song";

        if(index === currentSong){
            card.classList.add("playing");
        }

        card.innerHTML = `
            <img src="${song.cover}" alt="${song.album || song.title} cover">
            <div>
                <div class="songTitle">${song.title}</div>
                <div class="songArtist">${song.artist}</div>
                <div class="songAlbum">${song.album}</div>
            </div>
        `;

        card.onclick = ()=>{
            loadSong(index);
            buildLibrary(search.value);
            startPlayback();
        };

        songList.appendChild(card);
    });

    songCount.textContent = `${visibleSongs} ${visibleSongs === 1 ? "song" : "songs"}`;
}

function loadSong(index){
    currentSong = index;

    const song = songs[index];

    title.textContent = song.title;
    artist.textContent = song.artist;
    album.textContent = song.album || "Now Playing";
    cover.src = song.cover;
    cover.alt = `${song.album || song.title} cover`;
    audio.src = song.file;

    progress.value = 0;
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    activeLyric = -1;

    applyTheme(song.theme);
    renderLyrics(song.lyrics);
    updateLyrics(0);
    setPlaying(false);
}

function applyTheme(theme = {}){
    const nextTheme = {
        ...defaultTheme,
        ...theme
    };

    document.documentElement.style.setProperty("--primary", nextTheme.primary);
    document.documentElement.style.setProperty("--secondary", nextTheme.secondary);
    document.documentElement.style.setProperty("--accent", nextTheme.accent);
}

function setPlaying(isPlaying){
    playing = isPlaying;
    play.innerHTML = `<span class="material-symbols-rounded">${playing ? "pause" : "play_arrow"}</span>`;
    play.setAttribute("aria-label", playing ? "Pause" : "Play");
}

async function startPlayback(){
    try{
        await audio.play();
        setPlaying(true);
    }catch(error){
        setPlaying(false);
    }
}

function formatTime(seconds){
    if(!Number.isFinite(seconds)){
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2,"0");

    return `${minutes}:${remainingSeconds}`;
}

function renderLyrics(lyrics = []){
    if(!lyrics.length){
        lyricsCarousel.innerHTML = `<p class="emptyLyrics">No lyrics have been added for this song yet.</p>`;
        lyricsToggle.disabled = true;
        lyricsToggle.setAttribute("aria-label","Lyrics unavailable");
        lyricsStatus.textContent = "No lyrics";
        setLyricsVisible(false);
        return;
    }

    lyricsToggle.disabled = false;
    lyricsToggle.setAttribute("aria-label", lyricsVisible ? "Hide lyrics" : "Show lyrics");
    lyricsStatus.textContent = lyricsVisible ? "Following" : "Lyrics off";

    lyricsCarousel.innerHTML = "";

    const lyricsTrack = document.createElement("div");
    lyricsTrack.className = "lyricsTrack";

    lyrics.forEach((line,index)=>{
        const lyricLine = document.createElement("div");
        lyricLine.className = "lyricLine";
        lyricLine.dataset.index = index;
        lyricLine.textContent = line.text;
        lyricsTrack.appendChild(lyricLine);
    });

    lyricsCarousel.appendChild(lyricsTrack);
}

function setLyricsVisible(isVisible){
    lyricsVisible = isVisible;
    lyricsPanel.hidden = false;
    document.querySelector(".player").classList.toggle("lyricsOpen", lyricsVisible);
    lyricsToggle.setAttribute("aria-pressed", String(lyricsVisible));
    lyricsToggle.setAttribute("aria-label", lyricsVisible ? "Hide lyrics" : "Show lyrics");
    lyricsStatus.textContent = lyricsVisible ? "Following" : "Lyrics off";

    if(lyricsVisible){
        updateLyrics(audio.currentTime || 0, true);
    }
}

function getActiveLyricIndex(lyrics, time){
    if(!lyrics.length){
        return -1;
    }

    return lyrics.reduce((activeIndex,line,index)=>{
        return time >= line.time ? index : activeIndex;
    },0);
}

function updateLyrics(time, force = false){
    const lyrics = songs[currentSong]?.lyrics || [];

    if(!lyrics.length){
        return;
    }

    const nextActiveLyric = getActiveLyricIndex(lyrics,time);

    if(!force && nextActiveLyric === activeLyric){
        return;
    }

    activeLyric = nextActiveLyric;

    const lines = lyricsCarousel.querySelectorAll(".lyricLine");
    const track = lyricsCarousel.querySelector(".lyricsTrack");

    lines.forEach((line,index)=>{
        line.classList.toggle("past", index < activeLyric);
        line.classList.toggle("active", index === activeLyric);
    });

    if(track && lyricsVisible){
        const activeLine = lines[activeLyric];
        const carouselCenter = lyricsCarousel.clientHeight / 2;

        if(activeLine){
            const lineCenter = activeLine.offsetTop + (activeLine.offsetHeight / 2);
            track.style.transform = `translateY(${carouselCenter - lineCenter}px)`;
        }
    }
}

play.onclick = ()=>{
    if(!songs.length) return;

    if(playing){
        audio.pause();
        setPlaying(false);
    }else{
        startPlayback();
    }
};

next.onclick = ()=>{
    if(!songs.length) return;

    currentSong = (currentSong + 1) % songs.length;

    loadSong(currentSong);
    buildLibrary(search.value);
    startPlayback();
};

prev.onclick = ()=>{
    if(!songs.length) return;

    currentSong = currentSong === 0 ? songs.length - 1 : currentSong - 1;

    loadSong(currentSong);
    buildLibrary(search.value);
    startPlayback();
};

audio.ontimeupdate = ()=>{
    progress.max = audio.duration || 0;
    progress.value = audio.currentTime;
    currentTime.textContent = formatTime(audio.currentTime);
    duration.textContent = formatTime(audio.duration);
};

audio.onloadedmetadata = ()=>{
    duration.textContent = formatTime(audio.duration);
};

progress.oninput = ()=>{
    audio.currentTime = progress.value;
    updateLyrics(audio.currentTime, true);
};

audio.onended = ()=>{
    next.click();
};

search.oninput = ()=>{
    buildLibrary(search.value);
};

lyricsToggle.onclick = ()=>{
    if(lyricsToggle.disabled) return;

    setLyricsVisible(!lyricsVisible);
};

audio.addEventListener("timeupdate",()=>{
    updateLyrics(audio.currentTime);
});

loadSongs();
