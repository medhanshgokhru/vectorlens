export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

export function cosine(a, b) {
  if (!a.length || !b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function embed(text, dimensions = 64) {
  const vector = new Array(dimensions).fill(0);
  const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'into', 'find', 'all']);

  tokenize(text).forEach((word) => {
    if (stopWords.has(word)) return;
    let hash = 2166136261;
    for (let i = 0; i < word.length; i += 1) {
      hash ^= word.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const index = Math.abs(hash) % dimensions;
    vector[index] += 1;
  });

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? vector : vector.map((value) => value / norm);
}

export function chunkText(text, size = 420, overlap = 80) {
  const clean = String(text || '').replace(/\r/g, '').trim();
  if (!clean) return [];

  const chunks = [];
  let cursor = 0;
  while (cursor < clean.length) {
    let end = Math.min(cursor + size, clean.length);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf(' ', end);
      if (boundary > cursor + size * 0.6) end = boundary;
    }
    const chunk = clean.slice(cursor, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= clean.length) break;
    cursor = Math.max(end - overlap, cursor + 1);
  }
  return chunks.filter(Boolean);
}

export function buildCorpus(files) {
  return files.flatMap((file) =>
    chunkText(file.content).map((content, index) => ({
      id: `${file.id}-${index}`,
      title: file.name,
      type: file.type,
      content,
      chunkIndex: index,
      embedding: embed(content)
    }))
  );
}

export function searchCorpus(query, corpus, limit = 6) {
  const queryEmbedding = embed(query);
  return corpus
    .map((chunk) => ({
      ...chunk,
      score: cosine(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function generateAnswer(query, results) {
  if (!results.length || results[0].score < 0.08) {
    return 'No sufficiently relevant evidence was found in the current corpus. Add source documents or broaden the query.';
  }
  const snippets = results.slice(0, 3).map((result) => result.content.replace(/\s+/g, ' ').slice(0, 210));
  return `Based on ${results.length} retrieved chunk${results.length === 1 ? '' : 's'}, the strongest evidence indicates: ${snippets.join(' ')} This synthesis is grounded only in the sources shown below.`;
}
