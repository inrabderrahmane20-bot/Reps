# Medina

Medina is a Marrakech-focused community platform for discovering local news, trusted services, activities, communities, meetings, and useful places around the city.

The project is built with Next.js App Router, React, TypeScript, Tailwind CSS, `next-intl`, and `lucide-react`.

## What works today

- Localized English, French, and Arabic routes with RTL support.
- News, communities, activities, meetings, messages, services, search, and profile surfaces backed by sample data.
- Client demo sign-in stored in the browser.
- One account can switch from `client` to `professional` mode.
- Professionals can submit a service listing with category, description, area, and price range.
- A demo admin review queue can approve or reject pending service listings.
- Approved services appear in the Services directory and on the interactive Marrakech map.
- Services can be searched and filtered by category.
- The map supports search, category filters, selectable places, browser geolocation permission, and OpenStreetMap search links for directions.
- Responsive layout, keyboard focus states, reduced-motion support, and Arabic direction handling.

## Run locally

Requirements: Node.js 18.17+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000/en`.

Useful commands:

```bash
npm run build
npm run start
```

## Test the professional flow

1. Open `/en/profile`.
2. Enter any name and email, then continue as a client.
3. Select **I offer a service**.
4. Complete the service form and send it for verification.
5. Open **Demo admin review** and approve the pending listing.
6. Open `/en/services` or `/en/map` to see the approved listing.

The demo state is stored under the `medina-demo-state` key in browser local storage. Clear that key in DevTools to reset the test account and submissions.

## Project structure

```text
src/
	app/[locale]/       Localized pages
	components/         Shared layout, cards, UI, search, and meeting components
	data/mock.ts        Sample news, communities, activities, providers, and meetings
	i18n/               Locale configuration and navigation helpers
	lib/demo-store.ts   Browser-persisted demo account and verification state
```

## Product boundary

The current authentication and verification flow is intentionally a frontend demo so it can be tested without credentials or a database. Before production use, replace the demo store with a server-backed auth/session system, add an admin-only API for approvals, validate uploads and service data server-side, and use a real map provider with a configured API key and geocoding policy.

## Sample data

Sample Marrakech providers, communities, activities, news, meeting rooms, contacts, and conversations are included in `src/data/mock.ts`. They are designed to make the primary flows usable immediately after installation.
