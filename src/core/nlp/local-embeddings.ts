import * as natural from 'natural';
import { remove as removeStopwords } from 'stopwords';
import { distance } from 'fastest-levenshtein';

export interface SemanticResult {
  similarity: number;
  concepts: string[];
  entities: string[];
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  keywords: Array<{ word: string; score: number }>;
}

export interface EmbeddingOptions {
  dimensions?: number;
  stemming?: boolean;
  removeStopwords?: boolean;
  language?: string;
}

export class LocalNLPProcessor {
  private tfidf: natural.TfIdf;
  private stemmer: any;
  private sentiment: any;
  private wordnet: any;
  private cache: Map<string, number[]> = new Map();
  private options: Required<EmbeddingOptions>;

  constructor(options: EmbeddingOptions = {}) {
    this.options = {
      dimensions: 300,
      stemming: true,
      removeStopwords: true,
      language: 'en',
      ...options
    };

    this.tfidf = new natural.TfIdf();
    this.stemmer = natural.PorterStemmer;
    this.sentiment = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, ['negations', 'ngrams']);
    
    // Initialize word embeddings model (simplified GloVe-like approach)
    this.initializeEmbeddingModel();
  }

  private initializeEmbeddingModel(): void {
    // Initialize with common word vectors (simplified approach)
    // In production, you'd load pre-trained embeddings
    this.loadCommonVectors();
  }

  private loadCommonVectors(): void {
    // Load a small set of common word vectors for bootstrapping
    const commonWords = [
      'the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that',
      'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i',
      'server', 'deploy', 'config', 'database', 'api', 'code', 'system',
      'error', 'fix', 'update', 'install', 'create', 'delete', 'modify',
      'infrastructure', 'network', 'security', 'monitoring', 'backup'
    ];

    commonWords.forEach((word, index) => {
      const vector = this.generateSeededVector(word, this.options.dimensions);
      this.cache.set(word, vector);
    });
  }

  private generateSeededVector(text: string, dimensions: number): number[] {
    // Generate deterministic vector based on text content
    const vector = new Array(dimensions).fill(0);
    let hash = this.hashString(text);
    
    for (let i = 0; i < dimensions; i++) {
      // Use hash to generate reproducible random numbers
      hash = ((hash * 1664525) + 1013904223) % Math.pow(2, 32);
      vector[i] = (hash / Math.pow(2, 32)) * 2 - 1; // Normalize to [-1, 1]
    }

    return this.normalizeVector(vector);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  // === PUBLIC API ===

  /**
   * Generate embedding vector for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = text.toLowerCase().trim();
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const processed = this.preprocessText(text);
    const embedding = this.createEmbedding(processed);
    
    this.cache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Calculate semantic similarity between two texts
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    const embedding1 = await this.generateEmbedding(text1);
    const embedding2 = await this.generateEmbedding(text2);
    
    return this.cosineSimilarity(embedding1, embedding2);
  }

  /**
   * Analyze text semantically
   */
  async analyzeText(text: string): Promise<SemanticResult> {
    const processed = this.preprocessText(text);
    
    // Extract concepts using TF-IDF
    this.tfidf.addDocument(processed.tokens);
    const concepts = this.extractConcepts(processed.tokens);
    
    // Extract entities (simple NER)
    const entities = this.extractEntities(text);
    
    // Sentiment analysis
    const sentiment = this.analyzeSentiment(processed.tokens);
    
    // Extract keywords
    const keywords = this.extractKeywords(processed.tokens);
    
    // Calculate overall similarity/relevance
    const similarity = this.calculateTextComplexity(processed.tokens);

    return {
      similarity,
      concepts,
      entities,
      sentiment,
      keywords
    };
  }

  /**
   * Find semantic clusters in a set of texts
   */
  async findClusters(texts: string[], threshold: number = 0.7): Promise<string[][]> {
    const embeddings = await Promise.all(texts.map(text => this.generateEmbedding(text)));
    const clusters: string[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < texts.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [texts[i]];
      visited.add(i);

      for (let j = i + 1; j < texts.length; j++) {
        if (visited.has(j)) continue;

        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
        if (similarity >= threshold) {
          cluster.push(texts[j]);
          visited.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Extract topics from a collection of texts
   */
  extractTopics(texts: string[], numTopics: number = 5): Array<{ topic: string; words: string[]; score: number }> {
    // Simple topic extraction using TF-IDF
    const tfidf = new natural.TfIdf();
    
    texts.forEach(text => {
      const processed = this.preprocessText(text);
      tfidf.addDocument(processed.tokens);
    });

    const topics: Array<{ topic: string; words: string[]; score: number }> = [];

    for (let i = 0; i < Math.min(numTopics, texts.length); i++) {
      const topTerms = [];
      tfidf.listTerms(i).slice(0, 5).forEach(item => {
        topTerms.push(item.term);
      });

      if (topTerms.length > 0) {
        topics.push({
          topic: topTerms.join(', '),
          words: topTerms,
          score: topTerms.length / 5
        });
      }
    }

    return topics.sort((a, b) => b.score - a.score);
  }

  // === PRIVATE METHODS ===

  private preprocessText(text: string): {
    original: string;
    cleaned: string;
    tokens: string[];
    stems: string[];
  } {
    // Clean and normalize
    let cleaned = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Tokenize
    let tokens = natural.WordTokenizer.tokenize(cleaned) || [];

    // Remove stopwords if enabled
    if (this.options.removeStopwords) {
      tokens = removeStopwords(tokens, [this.options.language]);
    }

    // Stem if enabled
    const stems = this.options.stemming 
      ? tokens.map(token => this.stemmer.stem(token))
      : tokens;

    return {
      original: text,
      cleaned,
      tokens,
      stems
    };
  }

  private createEmbedding(processed: { tokens: string[]; stems: string[] }): number[] {
    const { dimensions } = this.options;
    const embedding = new Array(dimensions).fill(0);
    
    // Combine word vectors using average
    const relevantTokens = processed.stems.length > 0 ? processed.stems : processed.tokens;
    let validVectors = 0;

    for (const token of relevantTokens) {
      let vector = this.cache.get(token);
      
      if (!vector) {
        // Generate vector for unknown words
        vector = this.generateSeededVector(token, dimensions);
        this.cache.set(token, vector);
      }

      // Add to embedding
      for (let i = 0; i < dimensions; i++) {
        embedding[i] += vector[i];
      }
      validVectors++;
    }

    // Average the vectors
    if (validVectors > 0) {
      for (let i = 0; i < dimensions; i++) {
        embedding[i] /= validVectors;
      }
    }

    return this.normalizeVector(embedding);
  }

  private extractConcepts(tokens: string[]): string[] {
    // Extract noun phrases and compound concepts
    const concepts = new Set<string>();
    
    // Simple n-gram extraction
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        const ngram = tokens.slice(i, i + n).join(' ');
        if (this.isValidConcept(ngram)) {
          concepts.add(ngram);
        }
      }
    }

    // Add significant single words
    tokens.forEach(token => {
      if (token.length > 4 && this.isSignificantWord(token)) {
        concepts.add(token);
      }
    });

    return Array.from(concepts).slice(0, 10);
  }

  private extractEntities(text: string): string[] {
    const entities = new Set<string>();
    
    // Simple regex-based entity extraction
    const patterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
      /\b(?:https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, // URLs/domains
      /\b\d{1,3}(?:\.\d{1,3}){3}\b/g, // IP addresses
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\d+(?:\.\d+)*\b/g // Numbers/versions
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => entities.add(match));
    });

    return Array.from(entities).slice(0, 15);
  }

  private analyzeSentiment(tokens: string[]): { score: number; label: 'positive' | 'negative' | 'neutral' } {
    const analyzer = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, ['negations']);
    
    const score = analyzer.getSentiment(tokens);
    
    let label: 'positive' | 'negative' | 'neutral';
    if (score > 0.1) label = 'positive';
    else if (score < -0.1) label = 'negative';
    else label = 'neutral';

    return { score, label };
  }

  private extractKeywords(tokens: string[]): Array<{ word: string; score: number }> {
    const frequency = new Map<string, number>();
    
    tokens.forEach(token => {
      if (this.isSignificantWord(token)) {
        frequency.set(token, (frequency.get(token) || 0) + 1);
      }
    });

    return Array.from(frequency.entries())
      .map(([word, count]) => ({
        word,
        score: count / tokens.length
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private calculateTextComplexity(tokens: string[]): number {
    const uniqueWords = new Set(tokens).size;
    const totalWords = tokens.length;
    const avgWordLength = tokens.reduce((sum, token) => sum + token.length, 0) / totalWords;
    
    // Complexity score based on vocabulary diversity and word length
    return Math.min(1, (uniqueWords / totalWords) * (avgWordLength / 10));
  }

  private isValidConcept(ngram: string): boolean {
    const words = ngram.split(' ');
    return words.length >= 2 && 
           words.every(word => word.length > 2) &&
           !words.every(word => this.isCommonWord(word));
  }

  private isSignificantWord(word: string): boolean {
    return word.length > 3 && 
           !this.isCommonWord(word) &&
           /^[a-zA-Z]+$/.test(word);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
      'her', 'was', 'one', 'our', 'out', 'day', 'had', 'has', 'his', 'how',
      'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did',
      'its', 'let', 'put', 'say', 'she', 'too', 'use'
    ]);
    return commonWords.has(word.toLowerCase());
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // === CACHE MANAGEMENT ===

  clearCache(): void {
    this.cache.clear();
    this.loadCommonVectors();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // === UTILITY METHODS ===

  getSimilarWords(word: string, limit: number = 5): Array<{ word: string; similarity: number }> {
    const wordVector = this.cache.get(word.toLowerCase());
    if (!wordVector) return [];

    const similarities: Array<{ word: string; similarity: number }> = [];
    
    for (const [cachedWord, cachedVector] of this.cache.entries()) {
      if (cachedWord !== word.toLowerCase()) {
        const similarity = this.cosineSimilarity(wordVector, cachedVector);
        similarities.push({ word: cachedWord, similarity });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  expandQuery(query: string): string[] {
    const tokens = this.preprocessText(query).tokens;
    const expandedTerms = new Set(tokens);

    tokens.forEach(token => {
      const similar = this.getSimilarWords(token, 2);
      similar.forEach(({ word, similarity }) => {
        if (similarity > 0.7) {
          expandedTerms.add(word);
        }
      });
    });

    return Array.from(expandedTerms);
  }
}
