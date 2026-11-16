# Places to Visit audit

Date: 2026-11-16. Scope: `/[locale]/places/`, its reusable viewer and chapter overlay, and shared navigation where it caused this page to overflow. The existing editorial catalogue and database merge remain intact.

## Findings and changes

| Finding | Resolution |
| --- | --- |
| At 320px, the fully loaded navbar could widen the page to 370px, moving search and the destination viewer's close button outside the visible screen. | Compact the brand below 420px and reserve space for the utility controls. |
| The decorative hero arch added horizontal overflow on the narrowest screen. | Clip decorative horizontal paint at the Places page boundary without turning it into a scrolling container. |
| Long category introductions could extend above their image, including on desktop. | Use normal document flow for the introduction, a bounded scrollable hero and a sticky category/close toolbar. On very short screens, the introduction scrolls independently. |
| Categories could only be switched by leaving the chapter. | Add a translated category selector inside the existing chapter dialog; reset its introduction and list scroll when changing chapters. |
| The mobile information sheet used viewport-height calculations that could conflict with the actual overlay height. | Size it against the overlay and dynamic viewport, retain space for close/back controls and allow independent description scrolling. |
| Gallery arrow keys could navigate to a different destination; Arabic swipe direction did not match the controls. | Give the gallery its own keyboard focus and image navigation; keep destination gestures on the heading, mirror gallery movement for RTL and prevent swipe/click double activation. |
| Some controls were small or unavailable to keyboard users on mobile. | Provide 44px navigation/close targets, keyboard-focusable gallery, visible sheet navigation, focus outlines and a focus trap that excludes negative-tabindex controls. |
| Failed gallery fallback images could leave an endless loading shimmer. | End the loading state after a fallback failure; add local category-art fallbacks to catalogue and map-preview images. |
| The displayed map used Leaflet/CARTO/OpenStreetMap. | Replace the Places map with a real Google Maps iframe and a keyboard-accessible destination selector. Keep selection, preview, catalogue highlighting and viewer navigation synchronized. |
| External image URLs could lose their query parameters. | Preserve query parameters for non-Wikimedia image URLs. |

## Google Maps without a key

The user explicitly ruled out an API key. The implementation uses Google's public map embed, not the Maps JavaScript API or Maps Embed API. A live browser check confirmed the request redirects to a Google Maps embed and renders Google cartography with a location pin and attribution.

The selector follows the active category, city and text filters. The preview image or text opens the shared viewer with `source="map"`; catalogue cards use `source="list"`. Opening a card or navigating between list destinations updates the map. Viewer and map links use the same location query.

This constraint changes the original brief's map acceptance criteria:

- The iframe shows the selected destination. It does not show all 75 catalogue destinations simultaneously as custom markers.
- Google owns the iframe's interactions. Its internal marker clicks cannot open Annabid's viewer; use the adjacent destination preview.
- Custom photo markers, clustering and programmatic camera animations are not provided.
- Changing the selected location navigates the iframe to the new Google location. It does not reload the Annabid page.

These limitations are intentional consequences of the no-key requirement, not features claimed as completed. See [Google's map-sharing guidance](https://support.google.com/maps/answer/7101463) and [Maps JavaScript API setup requirements](https://developers.google.com/maps/documentation/javascript/get-api-key).

## Content integrity

All **75 original catalogue entries** are retained, along with the existing merge of active database records. **67 entries have stored coordinates**. Those coordinates were preserved, not independently re-geocoded or re-certified during this responsive audit.

The eight entries without coordinates use a Google search containing their existing name, city and country:

- Musée de la Femme
- Musée de la Femme de Marrakech
- Cafés
- Restaurants
- Parcs
- Piscines
- Hôtels
- Salles de sport (Karaté, Yoga, Musculation)

The two museum entries and broad establishment categories have not been deleted or silently assigned approximate coordinates. Their location-pending message remains visible.

## Verification

`node scripts/test-places-responsive.cjs` checks French, English and Arabic at:

`320×568`, `375×812`, `390×844`, `640×900`, `768×1024`, `912×768`, `1024×768`, `1440×900`, `1920×1080` and landscape `844×390`.

Checks include page overflow, overlay/close-button bounds, usable description scroll space, chapter opening/reveal/return, Escape and outside-click dismissal, gallery versus destination navigation, touch swipes, sheet dragging, category/city/search filters, no-results state, Google URL coordinates and locale, unnamed-coordinate fallback queries, catalogue preservation and forward/reverse focus trapping. No page JavaScript errors were observed in the completed matrix.

The regression suite stubs map transport and database reads and deliberately fails remote Wikimedia images to exercise local fallbacks. Real Google rendering was checked separately with network access. These are browser-emulated touch/viewports, not physical-device or Safari certification.

TypeScript verification: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.

Changes are local to the checkout; this audit does not deploy the site or alter the separate `/map/` page.
