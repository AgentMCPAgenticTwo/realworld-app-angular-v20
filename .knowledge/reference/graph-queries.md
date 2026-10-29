---
type: Reference
title: Graph queries
description: How to query the live codebase knowledge graph for this project.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/.codebase-memory
tags: [reference, tooling, graph]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T13:46:25Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 3a87e8e68c23204246655d54df5961c9299323ce
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

At the indexed commit: 1203 nodes, 1714 edges. Labels include `Variable` (675),
`File` (119), `Section` (118), `Module` (106), `Function` (75), `Method` (42),
`Folder` (33), `Class` (18), `Route` (4), `Interface` (3). Edge types include
`DEFINES`, `CALLS`, `USAGE`, `IMPORTS`, `DEFINES_METHOD`, `WRITES`, `DECORATES`,
`TESTS_FILE`, `CONFIGURES` and `HTTP_CALLS`.

Note that non-source files dominate the node count — `.test-gen/*.py` and its
JSON artefacts, `.ui-gen/corrections/*.json`, `.sage-maintenance/*.json` and the
`.github/workflows/*.yml` files. Every cluster, boundary and layer the graph
reports except the `src`/`e2e` ones comes from the `.test-gen` Python harness, and
`get_architecture`'s single entry point and top hotspot are `stubApi` in
`e2e/support/api-stub.ts`. Filter with `file_pattern: "src/**"` to stay inside the
application, or `"e2e/**"` for the browser tests
(see [test suites](/modules/testing.md)).

The four reported `Route` nodes are inferred from HTTP call sites, not from the
Angular router — the real route table is `routes` in
`src/app/app-routing.module.ts`, and the `https://example.test/thing` route comes
from `src/app/interceptors/api.interceptor.spec.ts`.

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
