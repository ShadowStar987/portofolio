# Game Developer Portfolio

A one-page portfolio with a retro game title-screen theme. Plain HTML, CSS and JavaScript: no frameworks, no build step, about 20 KB gzipped in total.

## Open it in PhpStorm

1. **File → Open…** and select the `portfolio` folder.
2. Open `index.html`, hover over the top-right corner of the editor and click a browser icon (Chrome, Firefox, Safari or Edge). PhpStorm serves the site on its built-in web server.
3. Alternative: open the terminal in PhpStorm and run `php -S localhost:8000`, then go to http://localhost:8000.

## Project structure

| File | What it contains |
|---|---|
| `index.html` | All content in English (the default language) |
| `js/i18n.js` | Dutch translations for every `data-i18n` key, plus small UI strings |
| `js/main.js` | Language switch, mobile menu, skill bars, project pop-ups, contact form, resume printing |
| `css/style.css` | All styling, including mobile layout and the print style for the resume |
| `assets/favicon.svg` | Browser tab icon |

## Make it yours

Search the project for `EDIT:` (Ctrl+Shift+F / Cmd+Shift+F) to find every place to change.

| What | Where |
|---|---|
| Your name | `Jarno` in `index.html` and `js/i18n.js` (Ctrl+Shift+R / Cmd+Shift+R to replace everywhere) |
| Email address | `you@example.com` (3 places, including `data-email` on the form) |
| Discord username | `yourname` inside `<span id="discord-name">` |
| Experience per skill | The `.skill-exp` badges, keys `skills.oneYear` and `skills.justStarted` |
| Projects | The `<li class="project-card">` blocks and their matching `<dialog>` blocks |
| Timeline | The `<li class="tl-item">` blocks. Use class `type-edu`, `type-work` or `type-milestone` |
| Resume | The `<article class="resume-sheet">` block inside `<dialog id="dlg-resume">` at the bottom of `index.html` |
| Blog posts | Copy an `<article class="post">` block |
| Links | GitHub, LinkedIn and the GitHub link in each project |

**Changing text:** edit the English in `index.html`, then update the Dutch line with the same key in `js/i18n.js`.

**Adding text:** give the element `data-i18n="section.newKey"` and add `'section.newKey': 'Dutch text'` to `js/i18n.js`. Only put `data-i18n` on elements that contain plain text (no child elements), because the translation replaces everything inside.

## How the requirements are met

| Requirement | How |
|---|---|
| Easy navigation | Sticky menu with 7 sections, hamburger menu on mobile, skip link, "back to top" |
| Skills and projects | Experience in years per skill, project cards with a details pop-up |
| Project details | Each pop-up lists genre, engine, technologies, features, challenges and solutions, lessons learned |
| Visual timeline | "World map" timeline with colour and text labels for education, work and milestones |
| Mobile and desktop | Responsive grid layout, tested breakpoints at 48rem and 60rem |
| English and Dutch | EN/NL switch, remembers the choice, follows the browser language, `?lang=nl` link works |
| Easy contact | GitHub, LinkedIn, email and Discord (with a copy button), plus a form that opens the visitor's email app |
| Blog | "Dev log" section with expandable posts |
| Load under 500 ms | ~20 KB gzipped, no frameworks, no images to download, scripts use `defer` |
| Accessibility | Semantic landmarks and headings, keyboard support, visible focus, `lang` updates on switch, form errors announced, colour never the only signal, respects reduced motion and Windows high contrast |
| Cross-browser | Standard HTML/CSS/JS supported by current Chrome, Firefox, Safari and Edge |
| No errors | HTML passes `html-validate`, JavaScript passes a syntax check and a runtime test |

## Gameplay clips

Each project card can show a short clip that plays on hover (desktop), on focus (keyboard) or with the play button (phone).
DownTop already has one: `assets/downtop.mp4` with the still image `assets/downtop.jpg`.

To add a clip to another project, copy the `<div class="project-thumb has-video">` block from the DownTop card into that card
(replacing its `<div class="project-thumb">`), change the file names and the name after the colon in the button.
Optionally copy the `<video class="dialog-video">` line into the project's pop-up too.

Keep clips short (5 to 8 seconds), 640 pixels wide and without sound:

```bash
ffmpeg -ss 12 -t 8 -i recording.mp4 -vf "scale=640:-2,fps=30" -an -c:v libx264 -pix_fmt yuv420p -crf 26 -preset slow -movflags +faststart name.mp4
ffmpeg -ss 20 -i recording.mp4 -frames:v 1 -vf "scale=640:-2" -q:v 4 name.jpg
```

## The resume

The "Resume" button in the menu and "Open my resume" in the top section open the resume in a pop-up. The "Save as PDF or print" button in that pop-up prints only the resume. In the print window, choose **Save as PDF** to get a PDF file.

## Check it yourself before handing in

- **Speed and accessibility:** Chrome DevTools → Lighthouse → run for Mobile and Desktop.
- **Keyboard:** unplug your mouse and use Tab, Enter and Escape through the whole page.
- **Screen reader:** NVDA (Windows) or VoiceOver (Mac: Cmd+F5).
- **Mobile:** Chrome DevTools → device toolbar (Ctrl+Shift+M).
- **HTML:** paste `index.html` into https://validator.w3.org/nu/.

## Optional: sending the form without an email app

The contact form opens the visitor's own email app, so no server is needed. If your teacher wants the form to send directly, you could add a `contact.php` that uses PHP's `mail()` function or a service such as Formspree. That needs real web hosting with PHP.
