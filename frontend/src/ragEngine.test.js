import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorpus, chunkText, cosine, generateAnswer, searchCorpus } from './ragEngine.js';

test('chunks text deterministically without empty chunks', () => {
  const chunks = chunkText('A'.repeat(300) + ' ' + 'B'.repeat(300), 250, 30);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length > 0));
});

test('builds searchable corpus chunks with embeddings', () => {
  const corpus = buildCorpus([
    { id: 'one', name: 'notes.txt', type: 'Text', content: 'The patient reported sedation and abnormal heartbeat.' }
  ]);
  assert.equal(corpus.length, 1);
  assert.equal(corpus[0].embedding.length, 64);
});

test('retrieves semantically overlapping text above unrelated text', () => {
  const corpus = buildCorpus([
    { id: 'a', name: 'medical.txt', type: 'Text', content: 'The patient reported sedation and abnormal cardiac rhythm.' },
    { id: 'b', name: 'weather.txt', type: 'Text', content: 'The rain forecast includes wind and sunny weather.' }
  ]);
  const results = searchCorpus('patient sedation cardiac rhythm', corpus);
  assert.equal(results[0].title, 'medical.txt');
});

test('returns a no-evidence answer for an empty corpus', () => {
  assert.match(generateAnswer('anything', []), /No sufficiently relevant evidence/);
});

test('produces one for identical unit vectors', () => {
  assert.ok(Math.abs(cosine([1, 0, 0], [1, 0, 0]) - 1) < 0.0001);
});
