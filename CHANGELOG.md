# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.7.0] - 2026-10-20

### Added
- **Surgical Problem Resolution Skill (`/fix`)**: Added `/fix <description or stacktrace>` canonical skill for rapid, cost-effective defect and regression remediation (ADR 006). Reduces token expenditure by 60%–75% and latency by ≥50% by bypassing product-owner, ux-designer, architect, and design approval pauses.
- **Mandatory Automated Regression Testing**: Requires developer to provide an automated test reproducing the issue (red to green) and a minimal code patch before QA validation.
- **Lightweight Defect Documentation**: Automated generation of `docs/fixes/<slug>.md` audit artifacts documenting root cause analysis (RCA ≤ 5 lines), modified files, and regression test verification.
- **Dynamic Team Status Filtering**: `/team-report` dynamically hides non-participating business roles (Product Owner, UX Designer, Architect) and design pause indicators (`⏸`) when inspecting `FIX` workflows, displaying exclusively the active technical circuit (`Dev`, `QA`, `Reviewer`).
- **Claude Code Live Side Panel Fix Mode**: Extended TypeScript definitions with `FlowKind = 'feature' | 'fix'` and updated `hooks/register.tsx` to render a compact 3-role live side panel for fix workflows.
- **Package Archive Generation (`--package`)**: Added packaging capabilities producing ready-to-load `.zip` and `.plugin` bundles (`npm run package:claude`, `npm run package:all`) with root-level manifests for Claude Desktop GUI and extension loaders.
- **Automated Multi-IDE Synchronization (Git Hooks)**: Added `scripts/setup-hooks.mjs` and `npm run setup:hooks` to install `post-commit` and `post-merge` hooks, keeping Antigravity, Claude Code, and Codex automatically synchronized upon every commit and pull.
- **Expanded Test Coverage**: Added `tests/fix-skill.test.mjs` and hook configuration tests, expanding test suite coverage to 67 automated tests (`67/67 passed`).

---

## [0.6.0] - 2026-10-16

### Added
- **Autonomous & Supervised Execution Modes**: Added `--no-pause` and `--auto-approve` flags to `/feature` for continuous unattended execution without design approval halts, while strictly preserving security safeguards (`git commit`, `git push`, destructive operations) (ADR 005).
- **Multi-Platform Simultaneous Installation**: Added `--install-all` flag to `scripts/build.mjs` and `npm run install:all` to compile and install into Google Antigravity, Claude Code, and OpenAI Codex in a single execution.
- **OpenAI Codex Platform Adapter**: Full support for OpenAI Codex via `scripts/codex.mjs`, deterministic packaging, automated transactional installation into `~/.agents/skills`, rollback recovery, and tests (ADR 004).
- **Prompt Optimization & Token Frugality**: Comprehensive overhaul of all 7 agent prompts in `src/agents/`, cutting conversational filler by ~15-30%, requiring 1st-sentence diagnoses, and mandating epistemic certainty markers (`[Seguro]`, `[Probable]`, `[Especulando]`) for PO and Architect (ADR 002).
- **Integrated DevOps Role in Backend Dev**: Backend developer automatically generates production-ready multi-stage Dockerfiles and CI/CD YAML pipelines with concise operational instructions (≤ 3 sentences).
- **Integrated Documenter Role in QA Engineer**: QA engineer maintains project `README.md` and documents new hooks and functions in single short sentences upon task verification.
- **Mobile-First & WCAG 2.1 AA Compliance**: Strict mobile-first layout rules, design token linkage, and WCAG 2.1 AA accessibility checklists (contrast ≥ 4.5:1, touch targets ≥ 44x44px, keyboard navigation) integrated into `ux-designer` and `frontend-dev`.
- **Critical-Only Code Review Filter**: `code-reviewer` strictly reports blocking issues (security, contract violation, functional regression), eliminating subjective style debates.
- **Automated Test Suites**: Expanded test coverage to 58 automated tests (`58/58 passed`), adding `tests/agent-optimization.test.mjs`, `tests/codex.test.mjs`, and `tests/approval-control.test.mjs`.

### Changed
- **Canonical Skill Renaming**: Renamed `equipo-panel` to `team-report` (`/team-report`) across canonical definitions, platform adapters, tests, and documentation (ADR 003).
- **Documentation Overhaul**: Synchronized English and Spanish documentation with comprehensive guides for execution modes, multi-platform installation, and command references.

---

## [0.5.0] - 2026-10-14

### Added
- **Multi-AI Architecture**: Re-architected `equipo-dev` into a Source-Adapter-Target pattern (`src/`, `platforms/`, `dist/`) separating platform-agnostic roles and skills from host-specific adapters (ADR 001).
- **Zero-Dependency Native Compiler**: Built native Node.js 18+ compiler (`scripts/build.mjs`) supporting Antigravity, Claude Code, Cursor, and GitHub Copilot.
- **Security & Path Traversal Guards**: Strict destination containment via `assertWithin` and authorized install target checks (`isAuthorizedInstallTarget`).
- **Comprehensive Compiler Tests**: Added `tests/build.test.mjs` and `tests/qa-verification.test.mjs`.

---

## [0.4.1] - 2026-10-13

### Changed
- Migrated team status inspection and log reset to standard skills (`equipo-panel`, `equipo-reiniciar`) for cross-assistant accessibility.
- Added textual fallback reporting for environments without native graphical side panels.

---

## [0.4.0] - 2026-10-12

### Added
- Feature resumption capability: `/feature continuemos con <nombre>` automatically scans existing artifacts in `docs/specs/`, `docs/ux/`, `docs/adr/`, and `docs/qa/` to resume from the exact unfinished step without repeating completed work.

---

## [0.3.0] - 2026-10-10

### Added
- **UI/UX Designer Role**: Introduced `ux-designer` subagent integrated with `ui-ux-pro-max`, generating `docs/ux/<feature>.md` and `design-system/` guidelines.
- Expanded team to 7 specialized engineering roles.

---

## [0.2.0] - 2026-10-08

### Added
- Live team status panel for Claude Code and session logger (`bitacora.mjs`) tracking agent invocations and human-in-the-loop approvals.
- Introduced `/equipo-panel` and `/equipo-reiniciar` commands.

---

## [0.1.0] - 2026-10-05

### Added
- Initial release of `equipo-dev` software development team with agile waterfall lifecycle: Product Owner, Architect, Backend Developer, Frontend Developer, QA Engineer, and Code Reviewer.
- Mandatory two-stage human approval gates (Specification and Architecture).
