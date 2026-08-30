// TF-IDF Vectorizer and Cosine Similarity Calculator for Ardhnarishwar Core-AI
import { cleanAndTokenize, extractAllGrams } from './tokenizer';

export type Vector = Map<string, number>;

export class TfIdfVectorizer {
  private idfMap: Map<string, number> = new Map();
  private totalDocs: number = 0;

  constructor(corpus?: string[]) {
    if (corpus && corpus.length > 0) {
      this.fit(corpus);
    }
  }

  public fit(docs: string[]): void {
    this.totalDocs = docs.length;
    const docFreq: Map<string, number> = new Map();

    for (const doc of docs) {
      const tokens = cleanAndTokenize(doc);
      const grams = new Set(extractAllGrams(tokens));
      
      for (const gram of grams) {
        docFreq.set(gram, (docFreq.get(gram) || 0) + 1);
      }
    }

    this.idfMap.clear();
    for (const [term, count] of docFreq.entries()) {
      // Smooth IDF calculation: log((N + 1) / (df + 1)) + 1
      const idf = Math.log((this.totalDocs + 1) / (count + 1)) + 1;
      this.idfMap.set(term, idf);
    }
  }

  public transform(text: string): Vector {
    const tokens = cleanAndTokenize(text);
    const grams = extractAllGrams(tokens);
    const tfMap: Map<string, number> = new Map();

    if (grams.length === 0) return new Map();

    // Term Frequency (TF)
    for (const gram of grams) {
      tfMap.set(gram, (tfMap.get(gram) || 0) + 1);
    }

    const vector: Vector = new Map();
    let sumSquares = 0;

    for (const [term, count] of tfMap.entries()) {
      const tf = count / grams.length;
      // If term is unseen, use a baseline smooth IDF
      const idf = this.idfMap.get(term) || (Math.log(this.totalDocs + 2) + 1);
      const tfIdf = tf * idf;
      vector.set(term, tfIdf);
      sumSquares += tfIdf * tfIdf;
    }

    // L2 Normalization
    const magnitude = Math.sqrt(sumSquares) || 1;
    for (const [term, val] of vector.entries()) {
      vector.set(term, val / magnitude);
    }

    return vector;
  }
}

export function computeCosineSimilarity(vecA: Vector, vecB: Vector): number {
  if (vecA.size === 0 || vecB.size === 0) return 0;

  let dotProduct = 0;
  // Iterate over smaller vector for speed
  const [smaller, larger] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];

  for (const [term, valA] of smaller.entries()) {
    const valB = larger.get(term);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  // Bound within [0, 1]
  return Math.max(0, Math.min(1, dotProduct));
}
