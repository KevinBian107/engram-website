<p align="center">
  <img src="assets/engram_logo.svg" alt="Engram" width="120" />
</p>

# Engram — website

The marketing / landing page for [**Engram**](https://github.com/KevinBian107/engram):
a macOS tool that turns a Microsoft OneNote notebook (exported as PDF) into a
local, [Obsidian](https://obsidian.md)-native Markdown vault — **a hierarchy
that is also a graph**.

> **Prototype.** Engram is an early v0.1 research prototype. It currently ingests
> only **Microsoft OneNote notebooks exported as PDF**, and runs on **macOS 14+
> (Apple Silicon)**. The site is honest about this in its *Prototype status*
> section.

## What's here

A dependency-free, single-page static site (no build step):

```
index.html      # the page: hero, what-it-is, graph, pipeline, features, start, status, refs
styles.css      # all styles (brand palette: ink / paper / blue / orange)
graph.js        # the interactive knowledge-graph mockup — a force simulation
                #   mirroring the real app's GraphEngine (Domain → Concept → .md)
app.js          # scroll-reveal, active-nav, copy-to-clipboard
assets/         # engram_logo.svg, engram_concept.svg
```

The knowledge-graph animation is a live force-directed simulation (node–node
repulsion, edge springs, gravity, damping) using the same physics constants as
the app's `GraphEngine`, abstracted into the project's conceptual layers —
**Domain** (notebook) → **Concept** (section) → **.md** (note) — with solid
hierarchy edges and dashed cross-links. Drag a node, or click one to highlight
its connections.

## Run / preview locally

It's plain static files — open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

## Deploy (GitHub Pages)

Push to `main`, then enable **Settings → Pages → Deploy from branch → `main` / root**.
No build step or framework is required.

## References

- [Obsidian](https://obsidian.md) — the vault format the output targets
- [Microsoft OneNote](https://www.onenote.com) — the capture source (PDF export)
- [mlx-vlm](https://github.com/Blaizzy/mlx-vlm) + [Qwen2.5-VL](https://github.com/QwenLM/Qwen2.5-VL) — the local vision model
- [PyMuPDF](https://pymupdf.readthedocs.io) — PDF parsing & rendering
- [Propel](https://github.com/KevinBian107/propel) — the research workflow

## License

[MIT](LICENSE) © 2026 Kaiwen Bian.

*This site shows conceptual mockups of the app, not screen recordings. Engram is
an independent research prototype, not affiliated with Microsoft, Obsidian, or
any model provider.*
