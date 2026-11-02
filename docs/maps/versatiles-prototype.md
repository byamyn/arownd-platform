# Arownd VersaTiles map prototype

This branch contains an isolated MapLibre style for VersaTiles' OpenStreetMap Shortbread tiles.

## Scope

- Keeps the existing MapLibre GL JS renderer and the existing OSM raster fallback.
- Adds a Shortbread-specific style in `src/components/sooqy/map-style-versatiles.ts`.
- Switches the main store map and store-location picker to that style on this branch only.
- Uses Arabic local-name attributes when supplied, then falls back to the default and English names.
- Adds adaptive store clustering with MapLibre's GeoJSON cluster index. Wide-area views show grouped counts; clicking a group zooms into it; detailed category pins are mounted at zoom 14 and closer.
- Adds 3D building extrusion from the Shortbread `buildings` layer only when a positive mapped `height` value exists. Buildings without mapped height remain accurate 2D footprints instead of receiving invented elevations.
- Reveals local streets from zoom 11 and fades building footprints in earlier, improving neighborhood-level legibility without pretending the source contains higher-resolution geometry.

## Important data and hosting constraints

- The hosted `tiles.versatiles.org` endpoint is a public demo service without uptime guarantees. It is used here only to validate the prototype.
- The hosted OSM tileset is the merged land-cover variant and therefore requires both OpenStreetMap and ESA WorldCover attribution.
- Shortbread's standard zoom range is 0–14; higher map zooms overzoom the maximum source zoom.
- 3D appearance depends on the optional `3d_buildings` extension and on mapped building height data in each area. Coverage is not guaranteed uniformly across Algeria.
- Arabic label availability depends on local-name attributes being present in the generated tiles and on the glyph service.

## Before production

1. Validate the live TileJSON metadata and actual features for Algiers, Sétif, and other target cities.
2. Confirm CORS, glyph coverage, attribution, caching, and service limits.
3. Inspect actual building-height coverage in Sétif and Algiers; only extrude buildings with mapped height attributes. Do not infer building dimensions from zoom or footprint area.
4. Replace the demo endpoint with a self-hosted or SLA-backed tile service.
5. Run lint, TypeScript, production build, mobile interaction, and visual regression checks.
6. Compare the map with the existing production style before merging.

## Hybrid terrain layer (opt-in)

- Adds Mapzen/AWS Terrain Tiles as a Terrarium-encoded `raster-dem` source.
- The source is registered in the style but remains unused until the user enables the 3D terrain control; the default map does not request DEM tiles.
- The terrain toggle calls MapLibre `setTerrain` on demand and removes terrain when switched off. It resets when the map style is replaced by the fallback.
- Terrain data is global bare-earth elevation, generally around 30 m resolution; it improves hills and ground relief but does not add building-level detail. Building extrusion remains a separate vector-data layer.
- Source attribution is included in the map source. Public AWS open-data hosting is free to access but should not be treated as a guaranteed production SLA. For high traffic, mirror/cache the open tiles or self-host a regional extract after validating attribution.
- The terrain layer is deliberately opt-in because DEM decoding and 3D terrain rendering add GPU and network work on mobile devices.