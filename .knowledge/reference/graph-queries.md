---
type: Reference
title: Graph queries
description: How to query the live codebase knowledge graph for this project.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/.codebase-memory
tags: [reference, tooling, graph]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

The graph lives at `.codebase-memory/graph.db.zst` and is served by the
`codebase-memory-mcp` server as project `realworld-app-angular-v20`.

# Tools

| Tool | Use for |
| --- | --- |
| `get_architecture` | Counts, languages, routes, layers, clusters, hotspots, file tree |
| `search_graph` | Find symbols by BM25 query, `name_pattern` or `qn_pattern` |
| `get_file_outline` | Declarations of one exact repository-relative file |
| `get_code_snippet` | Source of a symbol by qualified name |
| `trace_path` | Relationship paths between two symbols |
| `query_graph` | Read-only Cypher for multi-hop or aggregate questions |
| `search_code` | Literal/regex text search when the graph has no node |

# Shape of this graph

At the indexed commit: 212 nodes, 327 edges. Labels include `Variable` (75),
`File` (39), `Method` (33), `Module` (29), `Folder` (16), `Class` (10),
`Route` (2), `Function` (1). Edge types include `DEFINES`, `DEFINES_METHOD`,
`IMPORTS`, `CALLS`, `USAGE`, `DECORATES`, `TESTS_FILE` and `HTTP_CALLS`.

Note that non-source files are indexed too — `.ui-gen/corrections/*.json`,
`.sage-maintenance/*.json` and `.github/workflows/ui-correction.yml` contribute many
`Variable` nodes. Filter with `file_pattern: "src/**"` to stay inside the app.

# Useful queries

Every declaration in the application source, in file order:

```cypher
MATCH (n)
WHERE n.file_path IS NOT NULL
  AND (n:Class OR n:Method OR n:Function OR n:Variable)
RETURN n.name AS name, n.file_path AS file, n.start_line AS line
ORDER BY file, line
```

Methods of one component:

```
get_code_snippet(qualified_name:
  "realworld-app-angular-v20.src.app.components.tutorial-drawer.tutorial-drawer.component.TutorialDrawerComponent",
  source_mode: "full")
```

Who calls a method:

```cypher
MATCH (a)-[:CALLS]->(b)
WHERE b.name = "retrieveTutorials"
RETURN a.name AS caller, a.file_path AS file
```

Route table and layering:

```
get_architecture(aspects: ["routes", "layers", "clusters", "hotspots"])
```

Cypher caveat: list indexing such as `labels(n)[0]` is not supported by the query
parser — project individual properties instead.

Related: [Architecture](/architecture.md), [Modules](/modules/index.md).
