# Arownd — VersaTiles map prototype

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Experimental design/implementation note. Not a production map-service approval.

## Scope

This document records a MapLibre prototype based on VersaTiles OpenStreetMap Shortbread data. Its presence in the repository does not establish that this style is active on the production route or that the external tile service is approved for production traffic.

The prototype work covered:
- A Shortbread-specific MapLibre style and an OSM raster fallback.
- Arabic local-name labels when those attributes are available.
- GeoJSON clustering for stores at wider zoom levels.
- Optional 3D building extrusion only when a positive mapped height is present.
- Optional Terrarium-encoded elevation tiles for terrain rendering.

The referenced implementation path was src/components/sooqy/map-style-versatiles.ts. Confirm that this path and its consumers still exist before making changes.

## Data, attribution, and hosting constraints

- A public demo tile endpoint must not be treated as an uptime-backed production dependency.
- Verify attribution requirements for all enabled layers and source datasets.
- Validate zoom limits, CORS, glyph coverage, caching, and rate/service limits.
- Coverage of Arabic local names and mapped building heights varies by region.
- Terrain and 3D rendering add network, memory, and GPU costs, especially on mobile.

## Before enabling in production

1. Inspect the current map implementation and active style selection on main.
2. Validate TileJSON and real features in target Algerian cities.
3. Confirm all source attribution and licensing requirements.
4. Use a self-hosted or SLA-backed tile service for production needs.
5. Test mobile performance, fallback behavior, RTL labels, and accessibility.
6. Compare visual quality and reliability with the current production map.

## Decision record

Treat this as a prototype reference only. A production decision requires current source-code inspection, provider review, load testing, and explicit approval. Never infer building heights or geographic detail that is not present in source data.
