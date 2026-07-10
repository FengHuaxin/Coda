# File Structure Reference

Canonical path: `Coda/reference/file-structure.md`

This file is the Coda project file structure reference. Consult on demand; not loaded inline with skills.

```text
openspec/                              # OpenSpec — WHAT
├── config.yaml
├── changes/
│   ├── <name>/                        # Active change
│   │   ├── .openspec.yaml
│   │   ├── .Coda.yaml
│   │   ├── proposal.md                # Why + What
│   │   ├── design.md                  # High-level architecture decisions
│   │   ├── specs/<capability>/spec.md # Delta capability spec
│   │   ├── .Coda/handoff/            # Script-generated phase handoff packages
│   │   └── tasks.md                   # Task checklist
│   └── archive/YYYY-MM-DD-<name>/     # Archived
└── specs/<capability>/spec.md         # Main specs (merged on archive via OpenSpec delta semantics)

docs/superpowers/                      # Superpowers — HOW
├── specs/YYYY-MM-DD-<topic>-design.md # Design doc (technical RFC; annotated on archive)
└── plans/YYYY-MM-DD-<feature>.md      # Implementation plan (file header contains change metadata)

.Coda/
└── config.yaml                        # Coda project config (context_compression defaults to off; set to beta to enable)
```
