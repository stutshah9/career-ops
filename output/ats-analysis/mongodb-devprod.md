# ATS Analysis — MongoDB — Software Engineer, Developer Productivity (Build Team)

**Resume:** output/resumes/stuti-shah-mongodb-devprod.tex  
**JD URL:** https://www.mongodb.com/careers/jobs/7851388  
**Analysis date:** 2026-06-04

---

## Keyword Extraction (25 core ATS signals)

| # | Keyword | Before | After | Note |
|---|---------|--------|-------|------|
| 1 | Developer productivity | ✓ | ✓ | DMIS bullet |
| 2 | Build systems | ✓ | ✓ | Skills |
| 3 | CI/CD | ✓ | ✓ | Skills + Volvo bullet 1 |
| 4 | Developer tooling | ✓ | ✓ | Summary + bullets |
| 5 | Automation | ✓ | ✓ | DMIS tool |
| 6 | Python | ✓ | ✓ | |
| 7 | Java | ✓ | ✓ | |
| 8 | C (C++ adjacent) | ✓ | ✓ | Skills; JD says "interest in C++"; C covers the systems language signal |
| 9 | Performance optimization | ✓ | ✓ | TA bullet 1 |
| 10 | Reliability | ✓ | ✓ | Volvo bullet 3 |
| 11 | Reproducible builds | ✓ | ✓ | Volvo bullet 1 |
| 12 | Unit testing / code quality | ✓ | ✓ | JobHub bullet 2 |
| 13 | Debugging | ✓ | ✓ | TA bullet 2 + skills |
| 14 | Multi-language | ✓ | ✓ | Python, Java, C |
| 15 | Docker / Kubernetes | ✓ | ✓ | |
| 16 | GitOps / Git | ✓ | ✓ | |
| 17 | Internship experience | ✓ | ✓ | Volvo |
| 18 | Developer experience | ✗ | ✓ | Added to summary + DMIS bullet ("improving developer experience") |
| 19 | AI tools for development | ✗ | ✓ | Added to summary + Skills; JD explicitly requires "Experience with AI tools for development acceleration" |
| 20 | Build verification | ✗ | ✓ | YOLO11 bullet 2: "build and deployment" changed to "build and verification" (team name: Build & Verification) |
| 21 | Internal technical support | ✗ | ✓ | TA bullet 1 reframed: "Provided internal technical support to 200+ students" |
| 22 | Troubleshooting | ✗ | ✓ | TA bullet 2: "Debugged" changed to "Troubleshot" — matches JD's "internal technical support and troubleshooting" |
| 23 | Code packaging / shipping code | ✗ | ✓ | Volvo bullet 1: "reliable code packaging across... environments" |
| 24 | Bazel | ✗ | ✗ | JD says "interest in" — skip without direct evidence |
| 25 | Rust | ✗ | ✗ | Not in stack — skip |

**Before: 17/25 = 68%**  
**After: 23/25 = 92%**

---

## Changes made

**Summary:** Added "AI-assisted development workflows" (JD explicit requirement) and "improving developer experience" (JD's core function of the team).

**Volvo bullet 1:** Added "reliable code packaging" — the JD describes the team as ensuring "code packaging and shipping across all supported operating systems"; this maps directly to the GitOps deployment work.

**Volvo bullet 2 (DMIS):** "developer-productivity win" changed to "improved developer experience across engineering teams" — "developer experience" is the JD's primary metric.

**TA bullet 1:** "Mentored 200+ students" changed to "Provided internal technical support to 200+ students" — the JD's third responsibility is "provide internal technical support and troubleshooting." Teaching assistants are internal technical support; this framing is accurate.

**TA bullet 2:** "Debugged" changed to "Troubleshot" — JD pairs "troubleshooting" with "internal technical support" as a named responsibility.

**YOLO11 bullet 2:** "build and deployment workflow" changed to "build and verification workflow" — the team name is "Build & Verification."

**Skills Build & DevOps:** Added `AI-Assisted Development` — the JD explicitly requires this. Claude Code is an AI development tool Stuti actively uses (for this career-ops system). The claim is accurate.

---

## Keyword stuffing flags (what was NOT added)

| Term | Why skipped |
|------|-------------|
| Bazel | JD says "interest in Bazel" — it signals familiarity is nice but not required. Claiming Bazel experience without having used it surfaces immediately in a technical screen |
| Rust | Not in stack |
| C++ | Has C; the JD says "interest in C++" — C covers the systems language signal without overclaiming |

---

## AI tools for development — justification

The JD explicitly states: "Experience with AI tools for development acceleration and code quality improvement." Claude Code is the canonical example of this tool category. Stuti actively uses it for this career-ops system. Added as "AI-Assisted Development" in both summary and skills. Prepare a concrete example: "I've used Claude Code to automate data pipeline scripts, iterate on backend services, and build multi-step workflows — it accelerates development significantly."

---

## Honest fit assessment

**Strong fit.** The DMIS automation (shipping an internal developer-productivity tool with \$176,980 impact) is exactly what this Build Team does: "update tooling to improve reliability, performance, and developer experience." The TA troubleshooting maps to internal technical support. The CI/CD + GitOps + Kubernetes stack covers the build infrastructure.

**Bazel gap is the main screen risk.** Prepare: "I haven't used Bazel but I understand build dependency graphs and have worked with CI/CD systems (Kubernetes, Argo CD, GitOps) — I'm actively learning Bazel and see the parallels to what I've built."

---

## ATS formatting check

Single-column Jake's-Resume LaTeX compiled with Tectonic (XeTeX). Greenhouse parses cleanly. Standard section headings, no images or text boxes.
