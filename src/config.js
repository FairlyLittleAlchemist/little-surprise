// ✏️ EDIT THIS FILE: everything personal lives here.
export const config = {
  name: 'Jamie',               // her name
  password: 'Mister',           // what she types on the first screen (not case-sensitive)
  hint: 'What do I always say right before I say "John"?',
  from: 'me',

  // the boxes show up one at a time, in this order
  // (the last box, 'cats', opens empty and then the cats pop out)
  order: ['music', 'letter', 'cats'],

  // 🎵 paste Spotify links (Share → Copy Song Link). note = a line from you about the song.
  songs: [
    { url: 'https://open.spotify.com/track/75NpiadMk9sKKtGdlfuztV?si=6e33832955a04640', note: 'the one that made me think of you' },
    { url: 'https://open.spotify.com/track/3l8ACerUtJfRd0rxJJ4Gkx?si=b8bee0cf8b1343aa', note: 'for when you need a good day' },
    { url: 'https://open.spotify.com/track/50Q7Mj77N4UC6Ih49gs0x4?si=5ae258c4b1b84f89', note: 'just trust me on this one' },
  ],

  // optional: a track that autoplays in the background after the password (browsers may block autoplay). Leave '' to disable.
  bgMusic: '',

  // the letter: one array per page, one string per paragraph ("Dear <name>," is added on page 1)
  letter: [
    [
      'Ever since the first time I talked to you, something about you has stuck with me.',
      'I wanted to make you something that wasn\'t just a text, so I made this instead.',
    ],
    [
      'You always turn my day into something a bit more… well, alive.',
      'You have such a lively presence. For how loud and energetic you can be, there\'s something about you that\'s calming. You make the world around you so much more colorful.',
    ],
    [
      'And for how tough you can be, that makes you that much more endearing.',
      'I\'m glad I met you, and I\'m glad I get to be around you.',
      'No pressure, no big speech. Just: I\'m glad you exist, and I hope today feels like yours.',
    ],
  ],
};
