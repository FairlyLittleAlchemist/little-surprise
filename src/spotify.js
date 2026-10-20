// Thin wrapper around Spotify's official iFrame API.
// https://developer.spotify.com/documentation/embeds/references/iframe-api
let apiPromise;
function loadApi() {
  apiPromise ||= new Promise((resolve) => {
    window.onSpotifyIframeApiReady = resolve;
    const s = document.createElement('script');
    s.src = 'https://open.spotify.com/embed/iframe-api/v1';
    s.async = true;
    document.head.append(s);
  });
  return apiPromise;
}

// "https://open.spotify.com/track/ID?si=…" → "spotify:track:ID"
export function toUri(link = '') {
  if (link.startsWith('spotify:')) return link;
  const m = link.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  return m ? `spotify:${m[1]}:${m[2]}` : null;
}

// Mounts an embed into `el`. `onState(isPlaying)` fires as playback changes.
export async function mountPlayer(el, uri, onState) {
  const api = await loadApi();
  return new Promise((resolve) => {
    api.createController(el, { uri, width: '100%', height: 152 }, (c) => {
      c.addListener('playback_update', (e) => onState(!e.data.isPaused));
      resolve(c);
    });
  });
}
