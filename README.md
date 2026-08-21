# Dungeons & Databases

> Split the Realm — a reading-first journey from database pages and indexes to caching, replication, partitioning, sharding, and consistency, guided by an old, wise dragon.

Dungeons & Databases starts with a deliberately uncomfortable question: **why partition in the first place?**
Instead of naming a technique and working backward, each lesson introduces one measurable design pressure,
lets the reader observe it, and adds architecture only when the previous system can no longer answer it.

## Course

- Complete eight-lesson journey map
- The Archivist, an old dragon who introduces each challenge and closes with a reckoning
- Reading-first lessons with small explanatory diagrams where they help
- One focused diagnostic lab in Lesson 01
- Responsive dark and light themes
- Static GitHub Pages deployment

## Journey

1. The Groaning Vault — diagnose before prescribing
2. Beneath the Vault — pages, memory, and the working-set cliff
3. Sharpen Before You Split — query plans and indexes
4. The Borrowed Memory — cache-aside, invalidation, stampedes, and cold starts
5. Copies of the Ledger — replication, lag, read-your-writes, and failover
6. Divide the Hoard — partition pruning, retention, and the one-machine ceiling
7. Across Many Keeps — shard keys, routing, fan-out, and rebalancing
8. The Price of Many Realms — isolation, consistency, idempotency, sagas, and the final decision matrix

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
lessons/lesson-02-beneath-the-vault/       pages, buffer pool, and working-set lesson
lessons/lesson-03-sharpen-before-you-split/ query plans, indexes, and write-cost lesson
lessons/lesson-04-the-borrowed-memory/     external caching and invalidation lesson
lessons/lesson-05-copies-of-the-ledger/    replication, lag, and failover lesson
lessons/lesson-06-divide-the-hoard/        partitioning, pruning, and retention lesson
lessons/lesson-07-across-many-keeps/       shard keys, routing, and rebalancing lesson
lessons/lesson-08-the-price-of-many-realms/ consistency and final decision-matrix lesson
lessons/lesson-shared.css                  shared lesson framing
lessons/lesson-reading.css                 shared reading-first lesson components
public/og.png                              social preview and Archivist portrait
```

Modeled numbers are identified in the lessons; the database relationships they demonstrate are grounded in PostgreSQL behavior and link to official documentation where a technical rule needs a reference.

The teaching and interaction rules for the course live in [`docs/teaching-principles.md`](docs/teaching-principles.md).
