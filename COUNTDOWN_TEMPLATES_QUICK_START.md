# Countdown Page Templates – Quick Start

## What’s New

You now have a dedicated countdown page system for every webinar. Each webinar can point to a custom HTML/CSS/JS experience that runs before the room goes live. Templates live in the database (just like registration and thank-you pages) and can be assigned from the webinar edit screen.

## Feature Highlights

- 🎯 **Per-webinar selection** – choose a countdown design in the dashboard under “⏳ Countdown Page”.
- 🧩 **Dynamic variables** – same liquid-style placeholders you know:
  - `{{webinarTitle}}`, `{{webinarDescription}}`, `{{webinarDuration}}`
  - `{{webinarDate}}`, `{{webinarTime}}`, `{{timeZone}}`
  - `{{joinLink}}` (room) and `{{registrationLink}}` (public registration)
  - `{{countdown}}` – injects a live JavaScript countdown script
  - `{{countdownIso}}` – ISO timestamp if you want to hydrate your own timer
- 🧾 **System default template** – seeded via `prisma/seed-countdown-templates.ts`
- 🛠️ **Full CRUD API** – `/api/countdown-templates` endpoints mirror thank-you templates

## Getting Set Up

1. **Run the migration** after updating `prisma/schema.prisma`:
   ```bash
   npx prisma migrate dev --name add_countdown_templates
   npx prisma generate
   ```
2. **Seed the default template** (optional but recommended):
   ```bash
   npx tsx prisma/seed-countdown-templates.ts
   ```
3. **Assign a template** in the dashboard  
   `Dashboard → Webinars → Edit → ⏳ Countdown Page`
4. **Share the live page**  
   `https://your-app/countdown/<webinar-slug>?s=<scheduleId>`

## Working with Custom HTML

- Include a container with `id="countdown"` so the script can inject live values.
- Drop `{{countdown}}` inside a `<script>` tag anywhere in the document.
  ```html
  <div id="countdown">Loading...</div>
  <script>
    {{countdown}}
  </script>
  ```
- Need total control? Use `{{countdownIso}}` and your own JS to drive a framework component.

## API Reference

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/countdown-templates` | `GET` | List templates (admin/host) |
| `/api/countdown-templates` | `POST` | Create template |
| `/api/countdown-templates/[id]` | `GET` | Fetch single template |
| `/api/countdown-templates/[id]` | `PATCH` | Update template |
| `/api/countdown-templates/[id]` | `DELETE` | Remove template |

The payload shape matches the thank-you template API (`name`, `description`, `htmlCode`, `thumbnail`).

## Countdown Page Route

- Public URL: `/countdown/[slug]`
- Query params:
  - `s` – specify a schedule ID (optional; otherwise the next upcoming schedule is used)
  - `tz` – override the timezone string used for formatting (optional)

## Tips

- Use the same design language as your registration/thank-you flow to keep the experience cohesive.
- Drop the link into reminder emails or share it with attendees directly.
- Keep the CTA buttons pointing to `{{joinLink}}` and `{{registrationLink}}` so people can quickly join or update their info.

Happy launching! 🚀
