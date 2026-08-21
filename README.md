# Dungeons & Databases

> Split the Realm — an interactive journey from database pages and partitions to sharding, guided by an old, wise dragon.

Dungeons & Databases starts with a deliberately uncomfortable question: **why partition in the first place?**
Instead of naming a technique and working backward, each lesson introduces one measurable design pressure,
lets the reader observe it, and adds architecture only when the previous system can no longer answer it.

## Current milestone

- Course entrance and eight-lesson journey map
- The Archivist, an old dragon who introduces each challenge and closes with a reckoning
- Lesson 01: **The Groaning Vault**
- Lesson 02: **Beneath the Vault**
- Three interactive diagnostic workloads with persistent progress
- Visual walkthroughs of buffer hits, misses, working sets, and clock-sweep eviction
- Responsive dark and light themes
- Static GitHub Pages deployment

## Journey

1. The Groaning Vault — diagnose before prescribing
2. Beneath the Vault — pages, memory, and the working-set cliff
3. Sharpen Before You Split — query plans and indexes
4. Divide the Hoard — table partitioning and pruning
5. Seal the Old Chambers — retention and lifecycle management
6. One Castle, Same Foundation — the ceiling of one machine
7. Across Many Keeps — shard routing and key selection
8. The Price of Many Realms — hotspots, fan-out, and rebalancing

## Run locally

The site has no build step or dependencies. Serve the repository root with any static server.

```bash
python -m http.server 7014 --bind 127.0.0.1
```

Open <http://127.0.0.1:7014/>.

## Project structure

```text
index.html                                  course entrance and journey map
styles.css                                 shared visual system
site.js                                    shared theme behavior
lessons/lesson-01-the-groaning-vault/      first interactive lesson
lessons/lesson-02-beneath-the-vault/       pages and buffer-pool simulation
lessons/lesson-shared.css                  shared lesson framing
public/og.png                              social preview and Archivist portrait
```

The simulation is intentionally browser-only. Modeled numbers are identified in the interface; the database
relationships they demonstrate are grounded in real PostgreSQL behavior.

The teaching and interaction rules for future lessons live in [`docs/teaching-principles.md`](docs/teaching-principles.md).
