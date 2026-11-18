import { useMemo, useRef, useState } from 'react';
import { buildCorpus, generateAnswer, searchCorpus } from './ragEngine';

const ingestionSources = [
  { type: 'Text', count: '1.4M', latency: '62ms', health: 'Healthy' },
  { type: 'Audio', count: '420k', latency: '124ms', health: 'Healthy' },
  { type: 'Video', count: '185k', latency: '198ms', health: 'Monitoring' },
  { type: 'Images', count: '630k', latency: '95ms', health: 'Healthy' }
];

const retrievalResults = [
  {
    title: 'Clinical interview transcript bundle',
    type: 'Text',
    score: 0.96,
    latency: '38ms',
    snippet: 'The patient reports dizziness after anesthesia and mentions a delayed reaction to midazolam during sedation.'
  },
  {
    title: 'Audio note: emergency room handoff',
    type: 'Audio',
    score: 0.92,
    latency: '41ms',
    snippet: 'Paramedic report indicates pressure pain under the sternum and repeated episodes of tachycardia.'
  },
  {
    title: 'Surgical monitor clip',
    type: 'Video',
    score: 0.89,
    latency: '54ms',
    snippet: 'The ECG waveform shows reduced QRS amplitude and audible abnormal rhythm around the 3-minute mark.'
  },
  {
    title: 'Lab imaging summary',
    type: 'Image',
    score: 0.82,
    latency: '46ms',
    snippet: 'Borderline elevated troponin with diffuse ST-segment deviation detected in imaging annotation overlays.'
  }
];

const pipelineStages = [
  'Ingestion adapters',
  'Chunking + OCR + ASR',
  'Multimodal embeddings',
  'Vector store index',
  'Reranking + retrieval',
  'Grounded answer generation'
];

const benchmarkTable = [
  { model: 'MultimodalRAG', latency: '214ms', recall: '96.8%', cost: '$0.042' },
  { model: 'Text-only RAG', latency: '286ms', recall: '89.1%', cost: '$0.031' },
  { model: 'Hybrid vector search', latency: '242ms', recall: '93.4%', cost: '$0.035' }
];

function scoreQuery(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const tokens = new Set(['dizziness', 'anesthesia', 'sedation', 'tachycardia', 'ecg', 'troponin', 'reaction', 'patient']);
  const matches = terms.filter((term) => tokens.has(term)).length;
  const base = 0.76 + matches * 0.06;
  return Math.min(0.99, Number(base.toFixed(2)));
}

function App() {
  const [query, setQuery] = useState(
    'Find all evidence related to adverse reactions after sedation and abnormal cardiac rhythm during surgery.'
  );
  const [activeView, setActiveView] = useState('Overview');
  const [documents, setDocuments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vectorlens-documents') || '[]');
    } catch {
      return [];
    }
  });
  const [ingesting, setIngesting] = useState(false);
  const fileInputRef = useRef(null);

  const seedDocuments = useMemo(
    () => retrievalResults.map((result, index) => ({
      id: `seed-${index}`,
      name: result.title,
      type: result.type,
      content: result.snippet,
      seed: true
    })),
    []
  );

  const corpus = useMemo(
    () => buildCorpus([...seedDocuments, ...documents]),
    [seedDocuments, documents]
  );

  const rankedResults = useMemo(
    () => searchCorpus(query, corpus, 6),
    [query, corpus]
  );

  const answer = useMemo(
    () => generateAnswer(query, rankedResults),
    [query, rankedResults]
  );

  const relevance = rankedResults[0]?.score || 0;

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIngesting(true);
    const ingested = [];

    for (const file of files) {
      const acceptedTypes = ['text/plain', 'text/csv', 'text/markdown', 'application/json'];
      const acceptedExtensions = ['txt', 'md', 'csv', 'json'];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!acceptedTypes.includes(file.type) && !acceptedExtensions.includes(extension)) {
        ingested.push({
          id: `unsupported-${Date.now()}-${file.name}`,
          name: file.name,
          type: 'Unsupported',
          content: `Unsupported file type. For this local build, ingest TXT, MD, CSV, or JSON files.`,
          error: true
        });
        continue;
      }

      ingested.push({
        id: `doc-${Date.now()}-${file.name}`,
        name: file.name,
        type: extension === 'csv' ? 'Text/CSV' : 'Text',
        content: await file.text()
      });
    }

    const validDocuments = ingested.filter((document) => !document.error);
    const nextDocuments = [...documents, ...validDocuments];
    setDocuments(nextDocuments);
    localStorage.setItem('vectorlens-documents', JSON.stringify(nextDocuments));
    setIngesting(false);
    event.target.value = '';
  };

  const navigateView = (view) => {
    setActiveView(view);
    const sectionIds = {
      Overview: 'overview',
      Pipelines: 'pipelines',
      Retrieval: 'retrieval',
      Eval: 'evaluation'
    };
    document.getElementById(sectionIds[view])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-logo">V</div>
          <div>
            <p className="eyebrow">AI systems</p>
            <h2>VectorLens</h2>
          </div>
        </div>

        <nav className="nav-menu">
          {['Overview', 'Pipelines', 'Retrieval', 'Eval'].map((view) => (
            <button
              key={view}
              className={`nav-link ${activeView === view ? 'active' : ''}`}
              onClick={() => navigateView(view)}
            >
              {view}
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <p className="eyebrow">Cluster health</p>
          <h3>All nodes nominal</h3>
          <span>8 shards • 27 worker pods • 0.21% error rate</span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Research platform</p>
            <h1>Real-Time Multimodal RAG</h1>
          </div>
          <div className="topbar-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              multiple
              hidden
              onChange={handleFiles}
            />
            <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
              {ingesting ? 'Ingesting...' : 'Add sources'}
            </button>
            <button className="primary-btn" onClick={() => navigateView('Retrieval')}>
              Run retrieval
            </button>
          </div>
        </header>

        <section id="overview" className="hero-card">
          <div>
            <p className="eyebrow">Unified retrieval stack</p>
            <h2>Ingesting text, audio, video, and image context into one low-latency vector retrieval system.</h2>
          </div>
          <div className="hero-stats">
            <div>
              <strong>214ms</strong>
              <span>P95 latency</span>
            </div>
            <div>
              <strong>96.8%</strong>
              <span>Recall</span>
            </div>
          </div>
        </section>

        <section className="metrics-grid">
          {ingestionSources.map((item) => (
            <div key={item.type} className="metric-card">
              <span>{item.type}</span>
              <strong>{item.count}</strong>
              <small>{item.latency} / {item.health}</small>
            </div>
          ))}
        </section>

        <section id="pipelines" className="workspace-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Retrieval query</h3>
              <span>Vector store live</span>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={7}
            />

            <div className="signal-row">
              <div className="signal-chip">Relevance {relevance.toFixed(2)}</div>
              <div className="signal-chip">Retrieved 4/4 sources</div>
              <div className="signal-chip">Reranked by cross-encoder</div>
            </div>

            <div id="retrieval" className="answer-box">
              <strong>Grounded answer</strong>
              <p>{answer}</p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Pipeline architecture</h3>
              <span>Modular components</span>
            </div>

            <div className="stages-grid">
              {pipelineStages.map((stage, index) => (
                <div key={stage} className="stage-badge">
                  <span>{index + 1}</span>
                  {stage}
                </div>
              ))}
            </div>

            <div className="readout-box">
              <p><strong>Core stack:</strong> Pinecone / FAISS + LlamaIndex + Whisper + OCR + semantic reranking.</p>
              <p><strong>Focus:</strong> low-latency multimodal memory for grounded retrieval and summarization.</p>
            </div>
          </div>
        </section>

        <section id="evaluation" className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Top retrieved evidence</h3>
              <span>ranked results</span>
            </div>

            <div className="results-list">
              {rankedResults.map((result) => (
                <div key={result.id} className="result-item">
                  <div className="result-head">
                    <span className="type-tag">{result.type}</span>
                    <strong>{result.score.toFixed(2)}</strong>
                  </div>
                  <h4>{result.title} · chunk {result.chunkIndex + 1}</h4>
                  <p>{result.content.replace(/\s+/g, ' ').slice(0, 260)}</p>
                  <div className="meta-row">
                    <small>{documents.some((document) => document.name === result.title) ? 'Local source' : 'Seed source'}</small>
                    <small>cosine similarity</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Benchmark comparison</h3>
              <span>latency / recall</span>
            </div>

            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>System</th>
                  <th>Latency</th>
                  <th>Recall</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkTable.map((row) => (
                  <tr key={row.model}>
                    <td>{row.model}</td>
                    <td>{row.latency}</td>
                    <td>{row.recall}</td>
                    <td>{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
