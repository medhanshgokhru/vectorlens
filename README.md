# VectorLens

A real-time multimodal RAG system prototype designed for serious AI and ML engineering portfolios. This project focuses on a high-impact retrieval system that ingests text, audio, video, and image signals into a unified vector-search workflow.

## Product capabilities

This is a local-first RAG workstation, not a static portfolio page:

- ingest TXT, MD, CSV, and JSON documents in the browser
- persist ingested sources in local storage
- chunk documents and generate deterministic local embeddings
- search the entire local corpus with cosine similarity
- rank retrieved evidence by relevance
- synthesize grounded answers from the highest-ranked chunks
- navigate between overview, pipeline, retrieval, and evaluation views

The GitHub Pages build does not require a server or API key. Advanced audio/video/image transcription can be added behind production ingestion adapters, but text extraction and retrieval are fully functional locally.

## Why this is strong

This kind of project aligns with real-world AI work being shipped in production:

- vector search and retrieval pipelines
- multimodal AI systems
- information retrieval and grounding
- LLM + semantic memory workflows
- AI product infrastructure thinking

## Stack

- React + Vite
- JavaScript-driven simulation logic
- CSS-first product UI
- GitHub Pages friendly static build

## Run locally

1. Install dependencies:

   npm install
   npm --prefix frontend install

2. Start the app:

   npm run dev

3. Open:

   http://localhost:5173

## GitHub Pages deployment

This repository includes an automated GitHub Actions workflow for Pages. Push to `main`, then enable GitHub Pages in repository settings and choose **GitHub Actions** as the source.

For a local production build:

```bash
npm run build
npm run preview
```

The generated static content is in `frontend/dist`.

## Resume angle

This demonstrates:

- AI system design
- multimodal retrieval architecture
- vector database and indexing thinking
- performance-focused engineering decisions
- practical LLM + retrieval product experience

This is the kind of project that reads like serious software engineering work, not a generic personal site.
