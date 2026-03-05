# 🌍 Build a Palantir-Style 3D Geospatial Intelligence Dashboard

> A complete step-by-step guide to building a real-time global intelligence dashboard with 3D globe, live data layers, AI summarization, and spy-movie visual effects — using only free tools and open-source data.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Project Structure](#4-project-structure)
5. [Phase 1 — 3D Globe Setup](#5-phase-1--3d-globe-setup)
6. [Phase 2 — Visual Effects (Spy Mode)](#6-phase-2--visual-effects-spy-mode)
7. [Phase 3 — Live Data Layers](#7-phase-3--live-data-layers)
8. [Phase 4 — AI Intelligence Layer](#8-phase-4--ai-intelligence-layer)
9. [Phase 5 — News & RSS Aggregation](#9-phase-5--news--rss-aggregation)
10. [Phase 6 — Nepal-Specific Customization](#10-phase-6--nepal-specific-customization)
11. [Phase 7 — Backend & Edge Functions](#11-phase-7--backend--edge-functions)
12. [Phase 8 — Deployment](#12-phase-8--deployment)
13. [AI-Assisted Development Strategy](#13-ai-assisted-development-strategy)
14. [Free API Keys Reference](#14-free-api-keys-reference)
15. [Roadmap & Enhancements](#15-roadmap--enhancements)

---

## 1. Project Overview

### What You're Building

A browser-based 3D geospatial intelligence dashboard that fuses:

- 🛰️ Real-time satellite tracking
- ✈️ Live civilian & military flight data
- 🚢 Naval vessel monitoring
- 🌋 Earthquake & disaster feeds
- 📰 AI-summarized news aggregation
- 🎥 CCTV camera overlays
- 🔥 Wildfire satellite detection
- 💡 Spy-movie visual effects (NVG, thermal, CRT)

### Inspiration Projects

| Project | URL | What to Learn From |
|---|---|---|
| World Monitor | worldmonitor.app | News aggregation + CII scoring |
| WorldView (viral project) | github.com/koala73/worldmonitor | 3D globe + shader effects |
| LiveUAMap | liveuamap.com | Real-time conflict mapping |
| GDELT | gdeltproject.org | Event data pipeline |

---

## 2. Tech Stack

### Frontend
| Technology | Purpose | Why |
|---|---|---|
| **Vite + React + TypeScript** | App framework | Fast dev, type safety |
| **CesiumJS** | 3D globe engine | Industry standard, free |
| **deck.gl** | Data layer rendering | GPU-accelerated, handles millions of points |
| **MapLibre GL** | 2D fallback map | Lightweight alternative |
| **Three.js** | Post-processing shaders | NVG, thermal, CRT effects |
| **Tailwind CSS** | Styling | Rapid UI development |

### Backend / Edge
| Technology | Purpose | Why |
|---|---|---|
| **Vercel Edge Functions** | API proxy + AI calls | Free tier, globally distributed |
| **Upstash Redis** | Caching | Free tier, serverless |
| **Groq API** | AI summarization | Free tier, extremely fast |

### Data Sources (All Free)
| Data Type | Source | API |
|---|---|---|
| Satellites | CelesTrak | `celestrak.org/SOCRATES` |
| Civilian flights | OpenSky Network | `opensky-network.org/api` |
| Military flights | ADS-B Exchange | `adsbexchange.com` |
| Earthquakes | USGS | `earthquake.usgs.gov/fdsnws` |
| Naval vessels | MarineTraffic | Free tier |
| News / events | GDELT | `api.gdeltproject.org` |
| Conflicts & protests | GDELT | `api.gdeltproject.org` |
| Wildfires | NASA FIRMS | `firms.modaps.eosdis.nasa.gov` |
| Weather | Open-Meteo | `api.open-meteo.com` |
| Road network | OpenStreetMap | `overpass-api.de` |

---

## 3. Prerequisites

### Tools to Install

```bash
# Node.js (v18+)
https://nodejs.org

# Install pnpm (faster than npm)
npm install -g pnpm

# Install Claude Code CLI (AI coding agent)
npm install -g @anthropic-ai/claude-code

# Install Git
https://git-scm.com
```

### Accounts to Create (All Free)

- [ ] [Vercel](https://vercel.com) — deployment
- [ ] [Upstash](https://upstash.com) — Redis caching
- [ ] [Groq](https://console.groq.com) — AI API key
- [ ] [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api) — wildfire data
- [ ] [Cesium Ion](https://ion.cesium.com) — 3D tiles token (free)
- [ ] [OpenSky](https://opensky-network.org) — flight tracking

---

## 4. Project Structure

```
geospatial-dashboard/
├── api/                        # Vercel Edge Functions
│   ├── flights.ts              # OpenSky + ADS-B proxy
│   ├── satellites.ts           # CelesTrak proxy
│   ├── earthquakes.ts          # USGS proxy
│   ├── news.ts                 # RSS + GDELT proxy
│   ├── vessels.ts              # AIS maritime proxy
│   ├── fires.ts                # NASA FIRMS proxy
│   └── ai-brief.ts             # Groq AI summarization
├── src/
│   ├── components/
│   │   ├── Globe/
│   │   │   ├── GlobeViewer.tsx     # Main CesiumJS component
│   │   │   ├── ShaderEffects.tsx   # NVG, thermal, CRT effects
│   │   │   └── DataLayers.tsx      # Toggle layer manager
│   │   ├── Panels/
│   │   │   ├── IntelPanel.tsx      # Right side intelligence panel
│   │   │   ├── NewsPanel.tsx       # Live news feed
│   │   │   └── AlertPanel.tsx      # Active alerts
│   │   ├── Controls/
│   │   │   ├── LayerControls.tsx   # Data layer toggles
│   │   │   ├── ViewPresets.tsx     # Region shortcuts
│   │   │   └── EffectControls.tsx  # Visual effect sliders
│   │   └── Overlays/
│   │       ├── CCTVOverlay.tsx     # Camera feed projection
│   │       └── HUDOverlay.tsx      # Heads-up display
│   ├── hooks/
│   │   ├── useFlights.ts
│   │   ├── useSatellites.ts
│   │   ├── useEarthquakes.ts
│   │   └── useNewsFeed.ts
│   ├── data/
│   │   ├── locations.ts        # Cities, landmarks, coordinates
│   │   ├── feeds.ts            # RSS feed list
│   │   └── nepal/
│   │       ├── locations.ts    # Nepal-specific POIs
│   │       └── feeds.ts        # Nepali news sources
│   ├── utils/
│   │   ├── satellite.ts        # TLE parsing + orbit math
│   │   ├── classification.ts   # Threat classifier
│   │   └── geo.ts              # Geographic helpers
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── App.tsx
├── public/
├── .env.local                  # API keys (never commit this)
├── vite.config.ts
├── package.json
└── README.md
```

---

## 5. Phase 1 — 3D Globe Setup

### Step 1.1 — Initialize Project

```bash
pnpm create vite@latest geospatial-dashboard -- --template react-ts
cd geospatial-dashboard
pnpm install
```

### Step 1.2 — Install Core Dependencies

```bash
pnpm install cesium resium
pnpm install @deck.gl/core @deck.gl/layers @deck.gl/geo-layers
pnpm install satellite.js
pnpm install tailwindcss autoprefixer postcss
pnpm install lucide-react
pnpm install zustand          # State management
pnpm install date-fns         # Date utilities
pnpm install axios            # HTTP client
```

### Step 1.3 — Configure Vite for CesiumJS

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers',
          dest: 'cesium'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets',
          dest: 'cesium'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets',
          dest: 'cesium'
        }
      ]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium')
  }
})
```

### Step 1.4 — Basic Globe Component

```typescript
// src/components/Globe/GlobeViewer.tsx
import { Viewer, Entity, CameraFlyTo } from 'resium'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// Set your Cesium Ion token
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN

export default function GlobeViewer() {
  return (
    <Viewer
      full
      timeline={false}
      animation={false}
      baseLayerPicker={false}
      navigationHelpButton={false}
      homeButton={false}
      sceneModePicker={false}
      terrainProvider={Cesium.createWorldTerrain()}
    >
      {/* Data layers go here */}
    </Viewer>
  )
}
```

### Step 1.5 — Add Location Presets

```typescript
// src/data/locations.ts
export const LOCATIONS = {
  global:     { lat: 20,      lon: 0,       alt: 20000000, label: 'Global View' },
  nepal:      { lat: 28.3949, lon: 84.1240, alt: 1500000,  label: 'Nepal' },
  kathmandu:  { lat: 27.7172, lon: 85.3240, alt: 50000,    label: 'Kathmandu' },
  pokhara:    { lat: 28.2096, lon: 83.9856, alt: 30000,    label: 'Pokhara' },
  // Add more cities...
  middleEast: { lat: 27,      lon: 45,      alt: 5000000,  label: 'Middle East' },
  europe:     { lat: 54,      lon: 15,      alt: 5000000,  label: 'Europe' },
}

// Keyboard shortcuts: press 1-9 to jump to locations
export const SHORTCUTS: Record<string, keyof typeof LOCATIONS> = {
  '1': 'global', '2': 'nepal', '3': 'kathmandu',
  '4': 'pokhara', '5': 'middleEast', '6': 'europe'
}
```

---

## 6. Phase 2 — Visual Effects (Spy Mode)

This is what makes the dashboard look like a classified intelligence system.

### Step 2.1 — Install Post-Processing

```bash
pnpm install postprocessing three
```

### Step 2.2 — Shader Modes

Create 4 visual modes:

| Mode | Key | Effect |
|---|---|---|
| **Normal** | `F1` | Default satellite imagery |
| **Night Vision (NVG)** | `F2` | Green phosphor glow, scanlines |
| **Thermal (FLIR)** | `F3` | Heat color ramp (blue→red) |
| **CRT** | `F4` | Retro monitor scanlines + noise |

```glsl
// src/shaders/nightVision.glsl
// Night Vision Green Tint Shader
uniform sampler2D tDiffuse;
uniform float intensity;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  
  // Convert to grayscale
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  
  // Apply green phosphor tint
  vec3 nvg = vec3(0.0, gray * intensity, 0.0);
  
  // Add scanlines
  float scanline = sin(vUv.y * 800.0) * 0.04;
  nvg -= scanline;
  
  // Add noise grain
  float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
  nvg += noise * 0.02;
  
  gl_FragColor = vec4(nvg, color.a);
}
```

```glsl
// src/shaders/thermal.glsl
// FLIR Thermal Imaging Shader
uniform sampler2D tDiffuse;
varying vec2 vUv;

vec3 thermalColor(float t) {
  // Classic thermal: black → blue → cyan → green → yellow → red → white
  if (t < 0.25) return mix(vec3(0,0,0), vec3(0,0,1), t * 4.0);
  if (t < 0.5)  return mix(vec3(0,0,1), vec3(0,1,1), (t - 0.25) * 4.0);
  if (t < 0.75) return mix(vec3(0,1,1), vec3(1,1,0), (t - 0.5) * 4.0);
  return mix(vec3(1,1,0), vec3(1,0,0), (t - 0.75) * 4.0);
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float intensity = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(thermalColor(intensity), color.a);
}
```

### Step 2.3 — Effect Controls UI

```typescript
// src/components/Controls/EffectControls.tsx
// Sliders for: brightness, contrast, bloom intensity, scanline density
// Mode buttons: Normal / NVG / Thermal / CRT
// Real-time adjustment using Cesium's postProcessStages
```

---

## 7. Phase 3 — Live Data Layers

### Layer 1 — Satellite Tracking

```typescript
// src/hooks/useSatellites.ts
import * as satellite from 'satellite.js'

const TLE_SOURCES = {
  active:   'https://celestrak.org/SOCRATES/query.php?TYPE=2',
  starlink: 'https://celestrak.org/SOCRATES/query.php?NAME=STARLINK',
  weather:  'https://celestrak.org/SOCRATES/query.php?GROUP=weather',
}

export function useSatellites() {
  // 1. Fetch TLE data (Two-Line Element sets)
  // 2. Parse with satellite.js
  // 3. Calculate current position using sgp4() propagator
  // 4. Update positions every 1 second
  // 5. Return array of { id, lat, lon, alt, name, orbit }

  const propagate = (tle1: string, tle2: string) => {
    const satrec = satellite.twoline2satrec(tle1, tle2)
    const posVel = satellite.propagate(satrec, new Date())
    const gmst = satellite.gstime(new Date())
    const geo = satellite.eciToGeodetic(posVel.position as satellite.EciVec3<number>, gmst)
    return {
      lat: satellite.radiansToDegrees(geo.latitude),
      lon: satellite.radiansToDegrees(geo.longitude),
      alt: geo.height * 1000  // km to meters
    }
  }
}
```

### Layer 2 — Live Flight Tracking

```typescript
// api/flights.ts (Vercel Edge Function)
export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  // Civilian flights via OpenSky (free, no auth needed)
  const civilianRes = await fetch(
    'https://opensky-network.org/api/states/all'
  )
  
  // Military flights via ADS-B Exchange
  const militaryRes = await fetch(
    'https://adsbexchange.com/api/aircraft/v2/mil/',
    { headers: { 'api-auth': process.env.ADSB_KEY! } }
  )

  const civilian = await civilianRes.json()
  const military = await militaryRes.json()

  // Normalize both into same schema
  const flights = [
    ...civilian.states.map(normalizeOpenSky),
    ...military.ac.map(normalizeADSB)
  ]

  return Response.json(flights)
}

function normalizeOpenSky(state: any[]) {
  return {
    id: state[0],         // ICAO24
    callsign: state[1],
    lat: state[6],
    lon: state[5],
    alt: state[7],        // meters
    heading: state[10],
    speed: state[9],      // m/s
    type: 'civilian'
  }
}
```

### Layer 3 — Earthquake Feed

```typescript
// api/earthquakes.ts
export default async function handler(req: Request) {
  // USGS Earthquake API - completely free
  const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query')
  url.searchParams.set('format', 'geojson')
  url.searchParams.set('starttime', getTimeAgo(24))  // last 24h
  url.searchParams.set('minmagnitude', '2.5')
  url.searchParams.set('orderby', 'time')

  const res = await fetch(url.toString())
  return Response.json(await res.json())
}
```

### Layer 4 — NASA Wildfire Detection

```typescript
// api/fires.ts
export default async function handler(req: Request) {
  // NASA FIRMS VIIRS satellite thermal hotspots
  const apiKey = process.env.NASA_FIRMS_KEY
  const today = new Date().toISOString().split('T')[0]
  
  const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/VIIRS_SNPP_NRT/NPL/1/${today}`
  // Change 'NPL' to 'WORLD' for global, or any country ISO code
  
  const res = await fetch(url)
  const csv = await res.text()
  return Response.json(parseCSV(csv))
}
```

### Layer 5 — Street Traffic Particle System

```typescript
// Fetch road network from OpenStreetMap Overpass API
// Then spawn particle system to simulate traffic flow

async function fetchRoadNetwork(lat: number, lon: number, radius: number) {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"motorway|trunk|primary|secondary"]
      (around:${radius},${lat},${lon});
    );
    out geom;
  `
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
  })
  return res.json()
}

// Spawn particles along road segments
// Update positions every frame using requestAnimationFrame
// Color by road type: motorway=red, primary=yellow, secondary=white
```

### Layer 6 — CCTV Camera Feeds

```typescript
// Public CCTV sources (city open data portals)
const CCTV_SOURCES = {
  austin_tx: 'https://data.austintexas.gov/resource/b4k4-adkb.json',
  // Add more cities with public camera APIs
}

// For Nepal - check if Smart City initiatives have public feeds
// Kathmandu Valley has some public traffic cameras

// Project feed onto 3D geometry using Cesium's custom material
function projectCameraFeed(viewer: Cesium.Viewer, camera: CCTVCamera) {
  const canvas = document.createElement('canvas')
  // Draw image frame onto canvas
  // Use canvas as texture for a Cesium primitive at the camera location
}
```

---

## 8. Phase 4 — AI Intelligence Layer

### Step 4.1 — AI Brief Generation

```typescript
// api/ai-brief.ts
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req: Request) {
  const { headlines, region } = await req.json()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',  // Free, extremely fast
    messages: [
      {
        role: 'system',
        content: `You are an intelligence analyst providing a 3-sentence 
        situational awareness brief. Be factual, concise, and highlight 
        the most operationally significant developments. Focus on: ${region}`
      },
      {
        role: 'user',
        content: `Latest headlines:\n${headlines.join('\n')}\n\nProvide brief:`
      }
    ],
    max_tokens: 200,
    temperature: 0
  })

  return Response.json({ brief: completion.choices[0].message.content })
}
```

### Step 4.2 — Threat Classification

```typescript
// src/utils/classification.ts

// Stage 1: Instant keyword classifier
const THREAT_KEYWORDS = {
  critical: ['explosion', 'attack', 'missile', 'nuclear', 'coup', 'assassination'],
  high:     ['troops', 'military', 'sanctions', 'protest', 'riot', 'earthquake'],
  medium:   ['tension', 'dispute', 'warning', 'alert', 'flood', 'fire'],
  low:      ['meeting', 'talks', 'agreement', 'aid', 'election'],
}

export function classifyThreat(headline: string): ThreatLevel {
  const lower = headline.toLowerCase()
  for (const [level, keywords] of Object.entries(THREAT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return level as ThreatLevel
    }
  }
  return 'info'
}

// Stage 2: Async LLM override (fires in background)
// Cached in Redis for 24 hours by headline hash
```

### Step 4.3 — Country Instability Index (Nepal Version)

```typescript
// src/utils/instability.ts
interface SignalWeights {
  baselineRisk: 0.40,     // Pre-configured structural fragility
  unrestEvents: 0.20,     // Protests, strikes, demonstrations
  securityActivity: 0.20, // Military movements, police mobilization  
  newsVelocity: 0.20,     // Mention frequency weighted by severity
}

// Nepal-specific baseline: 35/100 (moderate fragility)
// Boost factors for Nepal:
// - Earthquake activity (very seismically active)
// - Political instability (frequent government changes)
// - Border tensions (India/China proximity)
```

---

## 9. Phase 5 — News & RSS Aggregation

### Nepal-Specific RSS Feeds

```typescript
// src/data/nepal/feeds.ts
export const NEPAL_FEEDS = [
  // English
  { url: 'https://kathmandupost.com/rss',         name: 'Kathmandu Post',   tier: 1 },
  { url: 'https://myrepublica.nagariknetwork.com/rss', name: 'My Republica', tier: 1 },
  { url: 'https://thehimalayantimes.com/feed',    name: 'Himalayan Times',  tier: 2 },
  { url: 'https://risingnepaldaily.com/feed',     name: 'Rising Nepal',     tier: 2 },
  { url: 'https://www.onlinekhabar.com/feed',     name: 'Online Khabar',    tier: 2 },

  // Nepali language
  { url: 'https://ekantipur.com/rss',             name: 'Ekantipur',        tier: 1 },
  { url: 'https://setopati.com/feed',             name: 'Setopati',         tier: 2 },
  { url: 'https://www.nagariknews.com/feed',      name: 'Nagarik',          tier: 2 },

  // International Nepal coverage
  { url: 'https://www.reuters.com/rss/topNews',   name: 'Reuters',          tier: 1 },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', name: 'BBC Asia', tier: 1 },
]
```

### RSS Proxy Edge Function

```typescript
// api/rss.ts
import { XMLParser } from 'fast-xml-parser'

const ALLOWED_DOMAINS = [
  'kathmandupost.com', 'myrepublica.nagariknetwork.com',
  'thehimalayantimes.com', 'ekantipur.com', 'reuters.com',
  // ... add all feed domains
]

export default async function handler(req: Request) {
  const { url } = await req.json()
  
  // Validate domain is in allowlist
  const domain = new URL(url).hostname
  if (!ALLOWED_DOMAINS.some(d => domain.endsWith(d))) {
    return new Response('Domain not allowed', { status: 403 })
  }

  const res = await fetch(url)
  const xml = await res.text()
  const parser = new XMLParser()
  const json = parser.parse(xml)

  const items = json.rss?.channel?.item || []
  return Response.json(items.map(normalizeItem))
}
```

---

## 10. Phase 6 — Nepal-Specific Customization

### Geographic Points of Interest

```typescript
// src/data/nepal/locations.ts
export const NEPAL_POI = {
  // Major cities
  kathmandu:  { lat: 27.7172, lon: 85.3240, label: 'Kathmandu',  type: 'capital' },
  pokhara:    { lat: 28.2096, lon: 83.9856, label: 'Pokhara',    type: 'city' },
  biratnagar: { lat: 26.4525, lon: 87.2718, label: 'Biratnagar', type: 'city' },
  birgunj:    { lat: 27.0104, lon: 84.8777, label: 'Birgunj',    type: 'city' },

  // Strategic locations
  tribhuvan_airport: { lat: 27.6966, lon: 85.3591, label: 'TIA', type: 'airport' },
  
  // Border crossings (important for monitoring)
  raxaul_border:     { lat: 27.0129, lon: 84.8502, label: 'Raxaul Border',     type: 'border' },
  sunauli_border:    { lat: 27.5074, lon: 83.4255, label: 'Sunauli Border',     type: 'border' },
  kodari_border:     { lat: 27.9851, lon: 85.9478, label: 'Kodari/Tatopani',   type: 'border' },

  // Earthquake fault zones
  main_frontal_thrust: { lat: 27.8, lon: 85.0, label: 'Main Frontal Thrust', type: 'fault' },

  // Political
  singha_durbar:  { lat: 27.6983, lon: 85.3181, label: 'Singha Durbar (PM Office)', type: 'govt' },
  narayanhiti:    { lat: 27.7167, lon: 85.3125, label: 'Narayanhiti Palace',         type: 'landmark' },
}
```

### Nepal Earthquake Monitoring

```typescript
// Nepal-specific earthquake config
// Nepal sits on the India-Eurasia collision zone — one of the most seismically active regions

const NEPAL_EARTHQUAKE_CONFIG = {
  defaultCenter: { lat: 28.3949, lon: 84.1240 },
  radius: 500,           // km radius from center
  minMagnitude: 3.0,     // Lower threshold for Nepal (very active)
  alertThreshold: 5.5,   // Trigger alert above this magnitude
  historicalReference: [
    { date: '2015-04-25', mag: 7.8, location: 'Gorkha', casualties: 8964 },
    { date: '2015-05-12', mag: 7.3, location: 'Dolakha', casualties: 218 },
  ]
}
```

### Keyword Monitor for Nepal

```typescript
// Custom alert keywords for Nepal context
const NEPAL_KEYWORDS = {
  political:   ['KP Oli', 'Prachanda', 'Deuba', 'UML', 'NC', 'parliament', 'coalition'],
  security:    ['APF', 'Nepal Army', 'police', 'protest', 'bandh', 'chakka jam'],
  disaster:    ['earthquake', 'flood', 'landslide', 'avalanche', 'BIPAD'],
  economic:    ['remittance', 'NRB', 'load shedding', 'NEA', 'fuel price'],
  border:      ['India-Nepal', 'China-Nepal', 'BRI', 'Lipulekh', 'Kalapani'],
  elections:   ['election', 'निर्वाचन', 'EC Nepal', 'bypolls'],
}
```

---

## 11. Phase 7 — Backend & Edge Functions

### Environment Variables

```bash
# .env.local — NEVER commit this file

# Cesium Ion (3D globe tiles)
VITE_CESIUM_TOKEN=your_cesium_ion_token

# AI
GROQ_API_KEY=gsk_xxx

# Caching
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Data sources
NASA_FIRMS_API_KEY=xxx
OPENSKY_USERNAME=xxx
OPENSKY_PASSWORD=xxx
ADSB_EXCHANGE_KEY=xxx

# Optional
ACLED_API_KEY=xxx
GDELT_API_KEY=xxx    # No key needed, GDELT is fully open
```

### Redis Caching Strategy

```typescript
// src/utils/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = 300  // seconds
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return cached as T

  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}

// TTL strategy:
// Satellites:  30 seconds  (fast moving)
// Flights:     60 seconds
// Earthquakes: 5 minutes
// News:        10 minutes
// AI briefs:   30 minutes
```

---

## 12. Phase 8 — Deployment

### Deploy to Vercel (Free)

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add GROQ_API_KEY
vercel env add UPSTASH_REDIS_REST_URL
# ... add all keys

# Deploy to production
vercel --prod
```

### Custom Domain (Optional)

```
# In Vercel dashboard:
# Settings → Domains → Add domain
# e.g., nepal-monitor.vercel.app (free subdomain)
# or connect your own domain
```

---

## 13. AI-Assisted Development Strategy

### The "Army of Agents" Approach

The viral creator built this in 3 days by running **multiple AI agents in parallel**. Here's how:

#### Terminal Setup (4 agents at once)
```
Terminal 1: claude --task "Build satellite tracking layer with orbit visualization"
Terminal 2: claude --task "Implement NVG and thermal shader effects"
Terminal 3: claude --task "Build RSS news aggregation + AI brief pipeline"
Terminal 4: claude --task "Create Nepal-specific data layer and POI database"
```

#### Prompt Templates for Claude Code

**For data layers:**
```
Build a React hook called useFlights() that:
1. Fetches from /api/flights every 30 seconds
2. Returns { flights, loading, error, lastUpdated }
3. Each flight has: id, callsign, lat, lon, alt, heading, speed, type (civilian/military)
4. Handles errors gracefully with exponential backoff
5. Uses TypeScript with strict types
```

**For visual effects:**
```
Add post-processing to the CesiumJS viewer with these modes:
- F1: Normal (default imagery)
- F2: Night Vision - green phosphor tint, scanlines, noise grain
- F3: Thermal FLIR - heat color ramp black→blue→cyan→green→yellow→red
- F4: CRT - horizontal scanlines, slight color aberration, vignette
Add keyboard shortcuts and a UI toggle panel.
```

**For performance issues:**
```
The particle system for street traffic is crashing the browser.
Implement:
1. Sequential loading: highways first, then arterials, then streets
2. LOD (Level of Detail): reduce particles when zoomed out
3. Frustum culling: only simulate particles in the camera view
4. Cap at 10,000 active particles max
```

#### Workflow Tips

1. **Screenshot-driven development** — screenshot the broken UI and paste directly into Claude
2. **One feature per agent** — don't mix concerns in a single conversation
3. **Commit after each working feature** — `git commit -m "feat: satellite tracking layer"`
4. **Use Claude for debugging** — paste the error + relevant code, ask for fix

---

## 14. Free API Keys Reference

| Service | URL | Free Tier | Notes |
|---|---|---|---|
| Cesium Ion | ion.cesium.com | 5GB tiles/month | Required for 3D globe |
| Groq | console.groq.com | 14,400 req/day | Fastest free AI |
| Upstash Redis | upstash.com | 10,000 req/day | Serverless Redis |
| OpenSky | opensky-network.org | 400 req/day | No auth needed for basic |
| NASA FIRMS | firms.modaps.eosdis.nasa.gov | Unlimited | Requires registration |
| USGS Earthquakes | earthquake.usgs.gov | Unlimited | Fully open |
| GDELT | gdeltproject.org | Unlimited | Fully open |
| ACLED | acleddata.com | Free for research | Requires application |
| Open-Meteo | open-meteo.com | 10,000 req/day | No key needed |
| Overpass API | overpass-api.de | Fair use | OpenStreetMap data |
| ADS-B Exchange | adsbexchange.com | Limited free | Best for military flights |

---

## 15. Roadmap & Enhancements

### MVP (Week 1)
- [ ] 3D globe with basic imagery
- [ ] Satellite tracking layer
- [ ] Live flight layer (civilian)
- [ ] Earthquake feed
- [ ] Nepal centering + POI labels

### V2 (Week 2)
- [ ] NVG + Thermal shader effects
- [ ] Nepal news RSS aggregation
- [ ] AI brief generation (Groq)
- [ ] Keyword monitor system
- [ ] Mobile-responsive layout

### V3 (Week 3)
- [ ] Military flight layer (ADS-B Exchange)
- [ ] NASA FIRMS wildfire layer
- [ ] Street traffic particle system
- [ ] CCTV camera overlay
- [ ] Country Instability Index for Nepal

### V4 (Month 2)
- [ ] Shareable URL state (zoom, layers, coordinates)
- [ ] Push notification alerts
- [ ] Historical data playback
- [ ] Telegram bot integration for alerts
- [ ] Docker self-hosted version

---

## Quick Start Checklist

```
□ 1. Clone or init project (pnpm create vite)
□ 2. Install dependencies (cesium, deck.gl, satellite.js)
□ 3. Get Cesium Ion token (free at ion.cesium.com)
□ 4. Get Groq API key (free at console.groq.com)
□ 5. Get Upstash Redis credentials (free at upstash.com)
□ 6. Run npm run dev and see globe
□ 7. Add satellite layer (celestrak TLE data)
□ 8. Add flight layer (OpenSky API)
□ 9. Add Nepal RSS feeds
□ 10. Deploy to Vercel
```

---

## Resources

- **CesiumJS Docs**: https://cesium.com/learn/cesiumjs-learn
- **deck.gl Examples**: https://deck.gl/examples
- **satellite.js**: https://github.com/shashwatak/satellite-js
- **World Monitor Source**: https://github.com/koala73/worldmonitor
- **GDELT Docs**: https://www.gdeltproject.org/data.html
- **Groq Docs**: https://console.groq.com/docs
- **Overpass Turbo** (test OSM queries): https://overpass-turbo.eu

---

*Built with open source data, AI agents, and a lot of caffeine. ☕*
