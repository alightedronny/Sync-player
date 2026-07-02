// Open a dynamic link mapping to PeerJS Signaling cloud servers
const peer = new Peer();
let conn = null;

// Bind interface references
const myIdEl = document.getElementById('my-id');
const partnerIdInput = document.getElementById('partner-id');
const connectBtn = document.getElementById('connect-btn');
const statusEl = document.getElementById('status');
const videoUrlInput = document.getElementById('video-url');
const loadVideoBtn = document.getElementById('load-video-btn');
const video = document.getElementById('shared-video');

// When PeerJS provisions your specific operational node address
peer.on('open', (id) => {
    myIdEl.innerText = id;
    statusEl.innerText = "Status: Ready to connect";
});

// Intercept incoming transmission requests initiated by your partner
peer.on('connection', (connection) => {
    conn = connection;
    setupConnectionHandlers();
    statusEl.innerText = "Status: Connected to Partner!";
});

// Explicit execution block to link out to your partner
connectBtn.addEventListener('click', () => {
    const partnerId = partnerIdInput.value.trim();
    if (partnerId) {
        statusEl.innerText = "Status: Connecting...";
        conn = peer.connect(partnerId);
        setupConnectionHandlers();
    }
});

// Data routing bindings
function setupConnectionHandlers() {
    conn.on('open', () => {
        statusEl.innerText = "Status: Connected!";
    });

    conn.on('data', (data) => {
        // Disconnect standard events briefly to prevent recursive update loops
        removeVideoListeners();

        if (data.type === 'LOAD') {
            video.src = data.url;
            video.load();
        } else if (data.type === 'PLAY') {
            video.currentTime = data.time;
            video.play();
        } else if (data.type === 'PAUSE') {
            video.pause();
            video.currentTime = data.time;
        }

        // Reconnect active local listeners
        addVideoListeners();
    });

    conn.on('close', () => {
        statusEl.innerText = "Status: Partner disconnected.";
    });
}

// Intercept load execution to sync source video across network streams
loadVideoBtn.addEventListener('click', () => {
    const url = videoUrlInput.value.trim();
    if (url) {
        video.src = url;
        video.load();
        if (conn && conn.open) {
            conn.send({ type: 'LOAD', url: url });
        }
    }
});

// Transfer real-time playback state updates across network nodes
function sendPlay() {
    if (conn && conn.open) {
        conn.send({ type: 'PLAY', time: video.currentTime });
    }
}

function sendPause() {
    if (conn && conn.open) {
        conn.send({ type: 'PAUSE', time: video.currentTime });
    }
}

// Manage lifecycle operations for media control state tracking
function addVideoListeners() {
    video.addEventListener('play', sendPlay);
    video.addEventListener('pause', sendPause);
    video.addEventListener('seeked', sendPlay);
}

function removeVideoListeners() {
    video.removeEventListener('play', sendPlay);
    video.removeEventListener('pause', sendPause);
    video.removeEventListener('seeked', sendPlay);
}

// Initial engagement tracking activation
addVideoListeners();
