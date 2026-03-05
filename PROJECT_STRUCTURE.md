# 🌍 E:\3dmap Project Structure Overview

## 📁 Project Organization

```
E:\3dmap/
├── api/                          # Backend API endpoints
├── src/                           # Frontend source code
├── public/                        # Static assets
├── Configuration files
└── Documentation
```

---

## 🔧 API Layer (`/api`)

Real-time data fetching endpoints:

| File | Purpose |
|------|---------|
| `flights.ts` | OpenSky Network - Real-time flight tracking |
| `satellites.ts` | CelesTrak - Satellite positions |
| `earthquakes.ts` | USGS - Seismic event data |
| `vessels.ts` | MarineTraffic - Maritime vessel tracking |
| `fires.ts` | NASA FIRMS - Wildfire detection |
| `news.ts` | RSS/GDELT - News aggregation |
| `ai-brief.ts` | Groq API - AI event summarization |

---

## 🎨 Components (`/src/components`)

### Globe Components
- `Globe/VesselLayer.tsx` - Maritime vessel visualization

### UI Panels
- `IntelligencePanel.tsx` - Main intelligence display
- `IntelPanel.tsx` - Intelligence briefing panel
- `NewsPanel.tsx` - Live news feed
- `LayerControls.tsx` - Data layer toggles
- `StatusBar.tsx` - Real-time status display
- `DataStatus.tsx` - Data freshness indicator

### Special Features
- `ISSCamera.tsx` - ISS live camera feed
- `FollowModeUI.tsx` - Camera follow mode
- `POVMap.tsx` - Point-of-view map
- `ThreatVisualization.tsx` - Threat level visualization
- `AIAlertSystem.tsx` - AI-powered alerts

### Styling
- `ISSCamera.css` - ISS camera styles
- `FollowModeUI.css` - Follow mode styles
- `POVMap.css` - POV map styles

---

## 🪝 Hooks (`/src/hooks`)

Data fetching and state management:

| Hook | Purpose |
|------|---------|
| `useFlightTracking.ts` | Real-time flight data |
| `useSatellites.ts` | Satellite tracking |
| `useEarthquakes.ts` | Earthquake monitoring |
| `useVessels.ts` | Vessel tracking |
| `useWildfires.ts` | Fire detection |
| `useNewsFeed.ts` | News aggregation |
| `useAIIntelligence.ts` | AI analysis |
| `useCameraMode.ts` | Camera mode management |
| `useCameraFollow.ts` | Camera follow logic |
| `useEffects.ts` | Visual effects |
| `useImageryLayer.ts` | Satellite imagery |
| `useEntitySelection.ts` | Entity selection |
| `useKeyboardEvents.ts` | Keyboard controls |

---

## 🛠️ Utilities (`/src/utils`)

Helper functions and managers:

| File | Purpose |
|------|---------|
| `api-helpers.ts` | API request utilities |
| `dataLayerManager.ts` | Layer visibility management |
| `effectsManager.ts` | Visual effects control |
| `entityColors.ts` | Color schemes for entities |
| `povGenerator.ts` | POV map generation |
| `satImageryProvider.ts` | Satellite imagery provider |
| `threatClassifier.ts` | Threat level classification |

---

## 📝 Types (`/src/types`)

TypeScript type definitions:

| File | Purpose |
|------|---------|
| `cameraMode.ts` | Camera mode types |
| `dataLayers.ts` | Data layer types |

---

## 📊 Key Features

### Real-Time Data Layers
✅ Flights - Live aircraft tracking
✅ Satellites - Orbital positions
✅ Earthquakes - Seismic events
✅ Vessels - Maritime traffic
✅ Fires - Wildfire detection
✅ News - Event aggregation

### Camera Modes
✅ Global View - Full globe
✅ Follow Mode - Track specific entity
✅ ISS Camera - Live ISS feed
✅ POV Map - Point-of-view visualization

### Intelligence Features
✅ AI Alert System - Automated threat detection
✅ Threat Visualization - Risk level display
✅ News Panel - Real-time news feed
✅ Intelligence Panel - Data briefing

### Visual Effects
✅ Layer controls - Toggle data visibility
✅ Status indicators - Data freshness
✅ Color coding - Entity classification
✅ Interactive globe - 3D navigation

---

## 📦 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript configuration |
| `tsconfig.node.json` | Node TypeScript config |
| `.env.local` | API credentials |
| `.env` | Environment variables |
| `index.html` | HTML entry point |

---

## 🎯 Main Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | React app initialization |
| `src/App.tsx` | Main app component |
| `src/locations.ts` | Location presets |

---

## 📸 Assets

| File | Purpose |
|------|---------|
| `11.jpg` | Screenshot/reference image |
| `23.jpg` | Screenshot/reference image |
| `Screenshot 2026-03-04 200018.jpg` | UI screenshot |
| `Screenshot 2026-03-05 111132.jpg` | UI screenshot |

---

## 🚀 Development Files

| File | Purpose |
|------|---------|
| `dev-server.js` | Development server setup |
| `fetch-live-data-example.ts` | API example |
| `test-api.html` | API testing page |
| `geospatial-intelligence-dashboard.md` | Documentation |

---

## 📋 Project Statistics

- **API Endpoints**: 7 (flights, satellites, earthquakes, vessels, fires, news, AI)
- **Components**: 13 UI components
- **Hooks**: 13 custom hooks
- **Utilities**: 7 helper modules
- **Data Layers**: 6 real-time sources
- **Camera Modes**: 4 different views

---

## 🔑 API Credentials

Configured in `.env.local`:
- ✅ Cesium Ion Token
- ✅ OpenSky Network (Flights)
- ✅ NASA FIRMS (Fires)
- ✅ Groq API (AI)

---

## 🎮 Features Summary

### Data Visualization
- 3D globe with terrain
- Real-time entity markers
- Color-coded by type
- Interactive controls

### Intelligence
- AI-powered alerts
- Threat classification
- News aggregation
- Event analysis

### Camera System
- Global view
- Entity follow mode
- ISS live camera
- POV mapping

### User Interface
- Layer controls
- Status indicators
- News panel
- Intelligence briefing

---

## 📊 Data Flow

```
APIs (OpenSky, USGS, NASA, etc.)
    ↓
Hooks (useFlights, useSatellites, etc.)
    ↓
Components (Globe, Panels, Controls)
    ↓
User Interface
```

---

## 🎯 Project Purpose

A comprehensive geospatial intelligence dashboard that displays:
- Real-time global events
- Live tracking data
- AI-powered analysis
- Interactive 3D visualization
- Multi-source data integration

---

**Status**: ✅ Complete Project Structure  
**Version**: 1.0.0  
**Type**: React + TypeScript + CesiumJS  
**Purpose**: Geospatial Intelligence Dashboard
