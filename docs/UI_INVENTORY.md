# Flirty Greece — Complete Screen / Component / Interaction Inventory

**Visual source of truth:** `/workspace/ui-references/batch-1` + `/workspace/ui-references/batch-2`  
**Rule:** Screenshots win for visual implementation. Spec wins for functional behavior.

---

## 1. Screen Inventory (from all screenshots)

### Auth & Entry
| # | Screen | Reference cues |
|---|--------|----------------|
| S01 | Splash | Full-bleed orange→magenta gradient; centered white flame+wordmark |
| S02 | Welcome / Landing | Same gradient; logo; tagline “It starts with a Swipe™”; legal links; white pills “Create account” / “Sign in”; “Trouble signing in?” |
| S03 | Phone number | Dark charcoal bg; “Can we get your number?”; country code + phone underlines; help link; disabled Next; numeric keypad |
| S04 | Login (implied) | Sign-in path from Welcome |
| S05 | Forgot / Trouble signing in (implied) | Link from Welcome |
| S06 | Email verification architecture (not in shots; required by spec) | |

### Onboarding (white, progress gradient bar pink→orange→purple)
| # | Screen | Notes |
|---|--------|-------|
| S07 | First name | Progress ~5%; underline input; “Can’t change it later.”; Done accessory + QWERTY |
| S08 | Birthday | Progress ~15%; DD/MM/YYYY segmented underlines; age-not-DOB caption; numeric keypad |
| S09 | Gender | Progress ~20%; Woman / Man / More pills; “Show my gender on my profile” checkbox; disabled Next |
| S10 | Sexual orientation | Progress ~30%; Skip; “Select up to 3”; list; show-on-profile checkbox; disabled Next |
| S11 | Interested in seeing | Progress ~35%; Women / Men / Everyone pills; disabled Next |
| S12 | Looking for | Progress ~50%; 2×3 emoji cards (Long-term partner, etc.); disabled Next |
| S13 | Lifestyle habits | Progress ~75%; Skip; personalized title; Drinking / Smoking / Workout / Pets chip sections; disabled Next |
| S14 | Interests | Progress ~85–90%; Skip; wrap pill tags; disabled Next |
| S15 | Add photos | Progress full accent; 2×3 dashed slots; gradient + buttons; “0 / 6”; “add 2 to start”; disabled Next |

### Main App — Discover
| # | Screen | Notes |
|---|--------|-------|
| S16 | Discover / card stack | Header logo + bell + filters; photo card; segment bars; name/age; badges (Nearby/Active); distance/home/height; 5 action buttons (Rewind, Nope, Super Like, Like, Boost); bottom tab bar |
| S17 | Discover tutorial overlay | Dashed zones: LAST PHOTO / NEXT PHOTO / OPEN PROFILE + hand icons |
| S18 | Swipe Like state | Card tilt right; green “LIKE” stamp; green heart FAB emphasis |
| S19 | Swipe Nope state | Card tilt left; pink “NOPE” stamp; pink X FAB emphasis |
| S20 | Discovery Settings | Done (blue); max distance slider+expand toggle; interested in; age range dual slider+expand; PREMIUM DISCOVERY (min photos, bio, interests, looking for) |

### Profile Detail (expanded)
| # | Screen | Notes |
|---|--------|-------|
| S21 | Profile top | Name+age; flame; photo carousel segments; ··· menu; Looking for badge; Essentials; floating X / Super Like / Like |
| S22 | Profile Essentials / Basics | Pale lavender bg `#F0F2FF`; white rounded cards; Essentials, Basics (education, love style, zodiac, communication) |
| S23 | Profile Lifestyle | Workout, smoking, drinking, pets rows |
| S24 | Profile Interests + DM CTA | Interest pills; “Send {Name} a message”; upsell; Type a message field |
| S25 | Profile footer actions | Share / Block / Report (red); floating action trio |

### Matches / Messages
| # | Screen | Notes |
|---|--------|-------|
| S26 | Messages list | Centered logo; shield; New matches horizontal (likes card + match thumbs); Messages list (Team / system + real chats); chat tab active |
| S27 | Match chat empty | Back; avatar+name; video + ···; optional push banner; “You matched…”, time; Get Read Receipts CTA; Type a message + Send; GIF / card / music utility circles |
| S28 | Match + iOS notifications modal | System alert overlay (Allow / Don’t Allow) |
| S29 | Active chat | Match system line; blue outgoing bubble; Sent + double-check receipt |

### Required by product but not fully screenshot-covered
S30 Who Likes You · S31 Top Picks · S32 Match Celebration · S33 Notifications · S34 Passport · S35 Boost · S36 Spotlight · S37 Premium / Plans · S38 Purchase Success/Error · S39 My Profile · S40 Edit Profile · S41 Settings / Privacy / Safety · S42 Blocked Users · S43 Report sheet · S44 Verification · S45 Account / Delete · S46 Super Like purchase · S47 Incognito settings

---

## 2. Navigation

```
Splash → Welcome
  ├─ Create account → Phone → OTP/verify → Onboarding chain → Discover
  └─ Sign in → Phone/email login → Discover

Bottom tabs (5):
  1. Discover (flame, active = red/gradient)
  2. Explore / grid+search
  3. Likes / Top Picks (star/spark; badge count)
  4. Messages (chat bubbles; active = pink-red gradient fill)
  5. Profile (silhouette)

Discover → Filters (modal) → Done
Discover card → Open Profile (sheet/push) → Like/Nope/SuperLike/Share/Block/Report/DM
Messages → Chat conversation
```

---

## 3. Component Inventory

### Shared chrome
- Status bar (system)
- Progress bar (onboarding): thin, orange→pink→purple gradient fill on light track
- Back chevron (black/gray)
- Skip text button (optional steps)
- Home indicator (iOS)
- Pill primary button (white on gradient / black text; or gray disabled)
- Pill outline choice buttons
- Checkbox + gray label
- Bottom tab bar (5 icons)
- Flame brand mark + wordmark (“Flirty Greece” branding replacing Tinder marks)

### Forms
- Underline text input (light mode)
- Underline phone + country selector (dark mode)
- Segmented DOB digit slots with per-digit underlines
- Chip/pill multi-select (interests, lifestyle)
- Emoji option cards (looking-for grid)
- Photo slot grid (dashed border, light fill, gradient circular +)

### Discover
- Profile card (rounded, full photo, bottom gradient, photo segments)
- Badges: Nearby (teal), Active (green)
- Info rows: lives in, distance, height, looking for
- Action button row: Rewind (yellow), Nope (red X), Super Like (blue star), Like (green heart), Boost (purple bolt) — size hierarchy small/large/medium/large/small
- LIKE / NOPE / SUPER LIKE stamps
- Tutorial dashed overlays + hand icons

### Profile detail
- Photo carousel + segments + overflow ···
- Looking-for pill with emoji
- Section cards: Essentials, Basics, Lifestyle, Interests
- Attribute rows (icon + label + value + inset dividers)
- Interest tags (light gray pills)
- DM prompt card + text field
- Share / Block / Report list buttons
- Floating action trio

### Chat
- New matches carousel (rounded rect thumbs; likes gold border; overlay icons)
- Conversation list row (avatar, title, verified badge, preview, unread dot)
- Chat header (avatar, name, video, ···)
- Push enable banner (pink-red gradient + Enable)
- System match timestamp line
- Outgoing blue bubble; incoming (implied white/gray)
- Receipt: Sent + blue double-check (+ optional +)
- Input pill: placeholder + Send
- Utility circles: profile card (blue), GIF (gray), music (green)
- Read Receipts blue CTA pill
- iOS permission alert modal

### Settings
- List rows, red slider tracks, red ON toggles, gray OFF toggles
- Dual-thumb age slider
- Chevron disclosure rows
- Section header + Platinum badge pill

---

## 4. States

| Area | States |
|------|--------|
| Next / primary CTAs | Disabled (light gray) until valid selection |
| Photo counter | `n / 6`; helper until ≥2 |
| Discover card | Idle, dragging, past threshold, cancelled, exiting L/R/Up, empty deck |
| Action buttons | Idle, pressed, glow on active action |
| Like stamps | Hidden → appear with swipe progress |
| Chat Send | Disabled (gray) when empty; enabled when text |
| Message | Optimistic → Sent → Delivered → Read; Failed + retry |
| Presence | Online / Offline / last seen |
| Typing | Show/hide indicator |
| Subscription | Free / Plus / Gold / Platinum; CURRENT PLAN |
| Entitlements | Remaining likes, Super Likes, rewinds, DMs, boosts |
| Boost/Spotlight | Inactive / Active (countdown) / Expired |
| Verification | Unverified / Pending / Verified |
| Report | Form → submitting → success/error |
| Network | Offline banner, reconnect, failed mutation |

---

## 5. Interactions & Gestures

### Discover gestures
- Horizontal pan → rotate + translate; right = Like, left = Pass
- Vertical up → Super Like
- Threshold + spring cancel
- Tap left/right of photo → prev/next photo
- Tap bottom / info → open profile
- Button taps mirror swipe exits
- Rewind reverses last eligible action (entitlement-gated)
- Boost activates visibility boost (entitlement/purchase)

### Profile
- Vertical scroll through cards
- Photo swipe / tap segments
- Like / Nope / Super Like from floating buttons
- DM field sends Direct Message (entitlement)
- Share / Block / Report

### Chat
- Send message; receive realtime
- Typing emit/receive
- Read receipts
- Enable push / Get Read Receipts CTAs
- Video / overflow menus (architecture present)

---

## 6. Animations & Transitions

- Splash brand hold → Welcome
- Onboarding step push + progress bar fill growth
- Card stack: drag rotation/translation/scale; next card rise; exit fly-off; stamp opacity
- Spring physics on cancel
- Match celebration (avatars + transition to chat) — required even if not fully shown
- Tab icon color/fill transitions
- Modal / sheet present (filters, report, premium)
- Chat bubble entrance; typing dots; receipt state change
- Keyboard avoid on forms/chat
- Purchase success/failure feedback

Libraries: Reanimated + Gesture Handler (native-driven).

---

## 7. Modals / Sheets / Overlays

- Discovery Settings modal (Done)
- iOS notification permission alert
- Push enable in-chat banner
- Report user flow
- Premium / plan purchase sheets
- Match celebration overlay
- Photo picker / camera sheet
- Gender “More” sub-options
- Filter / Passport destination pickers

---

## 8. Design Tokens (from screenshots)

### Colors
| Token | Approx |
|-------|--------|
| Brand gradient start | `#FF8E5E` / orange-coral |
| Brand gradient end | `#FD297B` / magenta |
| Progress gradient | orange → pink → purple |
| Splash/Welcome text | `#FFFFFF` |
| Onboarding bg | `#FFFFFF` |
| Phone screen bg | `#121212`–`#1A1A1A` |
| Primary text | `#000000` / `#212529` |
| Secondary text | `#6C757D`–`#A0A0A0` |
| Disabled button bg | light gray |
| Link / Done blue | `#007AFF` |
| Nope | red / pink |
| Like | green |
| Super Like | blue |
| Rewind | gold/yellow |
| Boost | purple |
| Nearby badge | teal |
| Active badge | green |
| Profile sheet bg | `#F0F2F9` / `#F0F2FF` |
| Outgoing bubble | vibrant blue |
| Slider/toggle ON | red (settings) |
| Report text | `#D2363F` |

### Typography
- System sans (SF Pro–like); large bold headlines; medium body; small captions
- Brand wordmark: lowercase rounded

### Spacing / shape
- Generous onboarding whitespace
- Pill radius ~999 for CTAs and choice buttons
- Cards ~16–20px radius
- Photo slots rounded + dashed stroke
- Action buttons circular with soft shadows
- Consistent ~16px horizontal padding

### Icons
Flame, bell, sliders, rewind, X, star, heart, bolt, home, grid+search, sparkles, chat, profile, shield, location pin, house, height ruler, ···, video, GIF, music note, ID card, verified check, interest/lifestyle line icons

---

## 9. Empty / Loading / Error (must implement)

| Surface | Empty | Loading | Error |
|---------|-------|---------|-------|
| Discover | Out of profiles + expand prefs CTA | Skeleton/card shimmer | Retry |
| Likes / Who Likes You | No likes yet | List skeleton | Retry |
| Messages | No matches / no messages | List skeleton | Retry |
| Chat | Match empty state (shown) | History load | Failed send + retry |
| Photos | Empty slots (shown) | Upload progress | Validation errors |
| Network | — | — | Offline + reconnect |

---

## 10. Branding remaps for Flirty Greece

Replace Tinder wordmark/flame visually with **Flirty Greece** brand assets while preserving layout, colors, and interaction model from references. Keep gradient language, action colors, and structure identical.
