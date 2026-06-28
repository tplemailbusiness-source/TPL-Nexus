# TPL Nexus v1.0 Beta - Master Development Brief

## Project Rule

Read the existing codebase completely before making any changes.

Do not rewrite the application from scratch.

Analyze the project architecture first.

Preserve all existing working functionality unless replacing it with something better.

TPL Nexus should evolve into a polished streaming platform rather than remain a simple music player.

---

## Overall Vision

TPL Nexus is a premium private music streaming platform built for my family.

It should feel inspired by:

- Apple Music
- macOS
- visionOS
- Disney+
- Modern Apple UI

Do not copy Apple's design. Create something cinematic, elegant, immersive, and uniquely TPL Nexus.

The final application should feel like a real commercial streaming platform that could realistically be used every day.

---

## Current Codebase Snapshot

The current project is a static frontend application with:

- `index.html` for the main app shell
- `css/style.css` for visual design, layout, responsive behavior, and animations
- `js/app.js` for loading songs, playback, search, dynamic theming, and lyrics behavior
- `data/songs.json` for song metadata, audio paths, cover art paths, theme colors, and timestamped lyrics
- `covers/` for album artwork
- `music/` for local audio files
- `assets/`, `icons/`, `fonts/`, and `albums/` folders reserved for growth

Current working features:

- Dynamic music library loaded from `data/songs.json`
- Search by song, artist, and album
- Album artwork display
- Play and pause
- Next and previous
- Progress bar
- Current time and duration display
- Random initial song selection
- Dynamic song loading
- Per-song color themes using `theme.primary`, `theme.secondary`, and `theme.accent`
- Frosted glass cinematic interface
- Responsive desktop, tablet, and mobile foundation
- Beat-by-beat synchronized lyrics
- Lyrics toggle button
- Lyrics carousel with active-line highlighting
- Basic mobile bottom navigation behavior

Deployment target:

- GitHub Pages

---

## Design Language

Primary palette:

- Dark Navy
- Deep Blue
- Cyan
- Teal

Use:

- Frosted glass
- Soft shadows
- Rounded corners
- Floating panels
- Elegant typography
- Spacious layouts
- Large album artwork

Nothing should feel cramped. The UI should breathe.

---

## Motion Design

Create one consistent animation system.

Nothing should instantly appear.

Nothing should instantly disappear.

Everything should animate.

Motion requirements:

- Smooth fades
- Crossfades
- Gentle scaling
- Sliding transitions
- Soft blur transitions
- Spring-like button presses
- Calm, premium pacing

Animations should feel intentional, smooth, and cinematic.

---

## Ambient Background Engine

Replace any static-feeling background with layered animated radial gradients.

Requirements:

- Multiple blurred gradients
- Very slow movement
- 20 to 60 second animation loops
- Smooth GPU-friendly animation
- Soft blur
- Elegant depth

The background should feel alive without becoming distracting.

---

## Dynamic Album Themes

Every song may define:

```json
"theme": {
  "primary": "#12326f",
  "secondary": "#0e6f8f",
  "accent": "#2ee6d6"
}
```

When songs change:

- Background colors transition
- Player glow changes
- Buttons update
- Highlights update
- Accent colors update

Transitions should last approximately 2 to 3 seconds.

Nothing should flash. Everything should smoothly morph.

---

## Album Change Transitions

Changing songs should feel magical.

Target sequence:

1. Current artwork scales to 96 percent.
2. Current artwork fades out.
3. Background colors begin changing.
4. New artwork fades in.
5. Artwork scales back to 100 percent.
6. Title crossfades.
7. Artist crossfades.
8. Glow updates.

The transition should feel cohesive, not like separate effects stitched together.

---

## Home Page

The homepage should become the main discovery page.

Display:

- Good Morning, Afternoon, or Evening greeting
- Continue Listening
- Recently Added
- Random Picks
- All Uploaded Songs
- Albums

Home represents every uploaded song.

---

## Library

Uploaded songs should not automatically appear in the user's Library.

Home:

- Every uploaded song

Library:

- Only songs the user manually adds

Users should be able to:

- Add to Library
- Remove from Library

Persist Library state using `localStorage`.

---

## Favorites

Favorites should be separate from Library.

Users should be able to:

- Favorite songs
- Unfavorite songs
- View a dedicated Favorites page

Persist Favorites state using `localStorage`.

---

## Albums

Create an Albums page.

Display albums as large artwork cards.

Selecting an album opens:

- Album cover
- Album title
- Artist
- Track list
- Play Album action
- Album information

---

## Artists

Create an Artists page.

Display:

- Artist names
- Albums by artist
- Songs by artist
- Placeholder artwork when needed

---

## Search

Improve search into a richer live search experience.

Search should cover:

- Song title
- Artist
- Album

Display live filtered results with clear grouping where useful.

---

## Player

Improve the player while preserving the existing playback foundation.

Add:

- Shuffle
- Repeat
- Volume
- Queue foundation
- Remaining time
- Better progress animation
- Favorite button
- Add to Library button

Keep:

- Play and pause
- Next and previous
- Progress seeking
- Album artwork
- Dynamic theme updates
- Beat-by-beat lyrics

---

## Lyrics

Preserve the existing Beat-by-Beat lyrics system.

Current lyrics data shape:

```json
"lyrics": [
  {
    "time": 0,
    "text": "Intro"
  },
  {
    "time": 8,
    "text": "Lyric line"
  }
]
```

Improve lyrics with:

- Smoother scrolling
- Animated highlighting
- Faded surrounding lines
- Optional full-screen lyrics mode
- Better mobile readability

Lyrics should be toggled on and off with an icon in the player controls.

---

## Cinematic Mode

Create an immersive listening mode.

Display only:

- Large artwork
- Beat-by-beat lyrics
- Ambient background
- Minimal controls

The experience should feel peaceful, cinematic, and focused.

---

## Expanded Now Playing

The mini-player should expand into a full now-playing experience.

Include:

- Large artwork
- Lyrics
- Queue button
- Shuffle
- Repeat
- Volume
- Favorite
- Add to Library
- Animated background

Transitioning between mini-player and full player should feel premium.

---

## Continue Listening

Remember:

- Last played song
- Playback position
- Volume
- Recently played songs

Resume automatically where appropriate.

Use `localStorage` for the first version.

---

## Navigation

Sidebar items must function.

Create proper pages with smooth transitions:

- Home
- Library
- Albums
- Artists
- Favorites
- Settings

Navigation should work on desktop, tablet, and mobile.

---

## Settings

Create a polished Settings page.

Include:

- Animated Background toggle
- Reduce Motion toggle
- Lyrics Size control
- Clear Favorites action
- Clear Library action
- Clear History action
- Theme setting placeholder for future work

---

## Responsive Design

Mobile experience is extremely important.

Requirements:

- No horizontal scrolling
- No clipped elements
- Proper spacing
- Large touch targets
- Sidebar becomes a slide-out drawer
- Bottom player optimized for thumbs
- Support iPhone safe areas

Desktop and mobile should both feel intentionally designed.

---

## Progressive Web App

Convert TPL Nexus into a complete Progressive Web App.

Add:

- `manifest.json`
- Service worker
- Offline caching
- `theme-color`
- `apple-touch-icon`
- Favicon
- Multiple icon sizes
- Splash screen support

Enable Add to Home Screen.

When launched from the Home Screen, the application should feel native.

---

## Performance

Performance requirements:

- Lazy load artwork
- Optimize animations
- Avoid unnecessary reflows
- Keep JavaScript modular
- Separate responsibilities
- Comment important sections
- Avoid unnecessary libraries

---

## Accessibility

Accessibility requirements:

- Keyboard support
- ARIA labels
- Visible focus states
- Reduced motion support
- Readable contrast
- Large mobile touch targets

---

## Future Foundation

Lay architectural groundwork for:

- Playlists
- Listening history
- Statistics
- Recently played
- Studio Notes
- Dynamic theme extraction from album artwork

Do not fully implement these systems until the core architecture can support them cleanly.

---

## Code Quality

Refactor where appropriate.

Keep code organized.

Avoid duplicated code.

Preserve existing features.

Do not leave the application in a broken state.

If a request is too large for one implementation pass, prioritize reusable architecture first, then implement as many requested features as possible while keeping the application stable.

---

## Suggested Build Order

1. Create a lightweight app state layer for current page, current song, queue, favorites, library, settings, and recently played.
2. Split `app.js` into smaller modules when the app grows beyond a single-file structure.
3. Make sidebar navigation functional with Home, Library, Albums, Artists, Favorites, and Settings views.
4. Add localStorage persistence for Library, Favorites, Settings, and Continue Listening.
5. Upgrade the player with shuffle, repeat, volume, remaining time, favorite, and Add to Library controls.
6. Improve lyrics with full-screen mode and smoother motion.
7. Build Albums and Artists pages from the existing song metadata.
8. Add Cinematic Mode.
9. Convert to PWA with manifest, service worker, icons, and offline caching.
10. Polish accessibility, reduced motion, focus states, and mobile safe-area support.
