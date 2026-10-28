<!-- sage:knowledge:start -->
<!-- Managed by sage-maintenance. This block is rewritten on every maintenance run; edit KNOWLEDGE_RULES in the service instead. -->

## Codebase knowledge (OKF)

This repository keeps a codebase knowledge graph and an agent-readable knowledge
bundle generated from it. Both are refreshed by the sage-maintenance workflow at
the end of every maintenance run -- read them before exploring the code.

- **Graph:** `.codebase-memory/graph.db.zst`, served by the codebase-memory-mcp
  MCP server as project `realworld-app-angular-v20`. Prefer `search_graph`, `trace_path`,
  `get_code_snippet`, `get_file_outline` and `get_architecture` over grepping or
  reading whole files.
- **Bundle:** `.knowledge/`, in Google's Open Knowledge Format (OKF) v0.2.
  Start at `.knowledge/index.md`.

### Rules for writing `.knowledge/` -- always follow these

Whenever you create or update any file under `.knowledge/`, write it in
OKF v0.2 exactly as below.

1. The bundle is a directory of markdown files. `index.md` and `log.md` are
   reserved at every level; every other `.md` file is one **concept**.
2. Every concept file starts with a YAML frontmatter block between `---` lines.
   `type` is REQUIRED and non-empty. Also write `title`, `description` (one
   sentence), `tags`, `resource`, `generated`, `sources` and `status`:

   ```yaml
   ---
   type: Module
   title: components/hero
   description: Scroll-driven hero section that renders a canvas frame sequence.
   resource: https://github.com/<org>/<repo>/tree/<default-branch>/components/hero
   tags: [frontend, hero]
   generated: { by: sage-maintenance/claude-code, at: 2026-01-01T00:00:00Z }
   sources:
     - id: cbm-graph
       resource: codebase-memory-mcp project realworld-app-angular-v20 @ <commit sha>
       title: Codebase knowledge graph
   status: stable
   ---
   ```

3. Concept types: `Codebase Overview`, `Architecture`, `Convention`, `Module`,
   `Playbook`, `Reference`. Every timestamp is ISO 8601 UTC with a `Z`.
4. Layout:

   ```
   .knowledge/
     index.md                    # bundle root index
     log.md                      # update history
     overview.md                 # type: Codebase Overview -- purpose, stack, scripts, entry points
     architecture.md             # type: Architecture -- clusters, layers, boundaries, hotspots, call/render tree
     conventions.md              # type: Convention
     modules/index.md
     modules/<module-slug>.md    # type: Module -- one per source package/directory (at most 40)
     playbooks/common-tasks.md   # type: Playbook -- "to change X, go to Y"
     reference/graph-queries.md  # type: Reference -- how to query the live graph
   ```

5. `index.md` files carry NO frontmatter, except the bundle-root `index.md`,
   whose frontmatter is only `okf_version: "0.2"`. The body is `# Heading`
   sections of `* [Title](path) - description` entries, using each concept's own
   `description`.
6. `log.md` carries no frontmatter: `# Knowledge Update Log`, then `## YYYY-MM-DD`
   groups, newest first, with entries such as `* **Update**: ...` or
   `* **Creation**: ...`. Add new entries at the top; never rewrite old ones.
7. Link concepts with bundle-absolute markdown links, e.g.
   `[Hero](/modules/components-hero.md)`. The links are the knowledge-graph
   edges; state the relationship in the prose ("depends on", "rendered by").
8. Bodies use headings, tables and lists rather than long prose. Every file path
   and symbol you name must exist in the graph.
9. When updating a concept, keep human edits and any `verified` entries. When
   the code a concept describes is removed, set `status: deprecated` rather than
   deleting the file.

<!-- sage:knowledge:end -->
