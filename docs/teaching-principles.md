# Teaching principles

These rules apply to every Dungeons & Databases lesson.

## Explanation before interaction

Build the mental model before asking the reader to operate it. Introduce the nouns, show the mechanism in a
small worked example, and state why it matters before offering any controls.

## Interactivity must earn its place

Use a simple visual sequence by default. Add an interactive component only when the reader's action reveals a
relationship that a static visual cannot communicate as clearly.

An interaction should answer a concrete question, such as:

- How does changing a partition key alter data distribution?
- Where does a query route after a shard is added?
- Which pages are pruned when a date predicate changes?

Do not add controls merely to make a lesson feel interactive. Sliders, tabs, simulations, and progress counters
are costs the reader must understand before they can learn from them.

## One visual, one job

Every visual should explain one mechanism. Prefer a labeled before-and-after, a short sequence, or a worked
example over a dense dashboard that exposes every state at once.

## Always close the loop

After each mechanism, state:

1. What happened.
2. Why the database behaved that way.
3. Which design decision this knowledge will influence later.

The Archivist's Reckoning should summarize what was solved, what remains unsolved, and the current architecture.
