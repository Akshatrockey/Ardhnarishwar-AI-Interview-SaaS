"""
In-House TF-IDF Vectorizer and Cosine Similarity Calculator (Pure Python + Scikit-Learn Fallback)
Zero-Trust, Zero 3rd-Party API Dependency
"""

import math
import re
from typing import List, Dict, Tuple, Set

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more",
    "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
    "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
    "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom",
    "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
    "your", "yours", "yourself", "yourselves"
}

def tokenize(text: str) -> List[str]:
    cleaned = re.sub(r'[^a-zA-Z0-9\s_-]', ' ', text.lower())
    tokens = [w for w in cleaned.split() if w and w not in STOP_WORDS]
    return tokens

def extract_ngrams(tokens: List[str], ngram_range: Tuple[int, int] = (1, 2)) -> List[str]:
    min_n, max_n = ngram_range
    grams = []
    for n in range(min_n, max_n + 1):
        for i in range(len(tokens) - n + 1):
            grams.append(" ".join(tokens[i:i+n]))
    return grams

class PureTfIdfVectorizer:
    def __init__(self, ngram_range: Tuple[int, int] = (1, 2)):
        self.ngram_range = ngram_range
        self.idf_map: Dict[str, float] = {}
        self.total_docs: int = 0

    def fit(self, docs: List[str]) -> "PureTfIdfVectorizer":
        self.total_docs = len(docs)
        doc_freq: Dict[str, int] = {}
        for doc in docs:
            tokens = tokenize(doc)
            unique_grams = set(extract_ngrams(tokens, self.ngram_range))
            for g in unique_grams:
                doc_freq[g] = doc_freq.get(g, 0) + 1

        self.idf_map = {}
        for term, count in doc_freq.items():
            self.idf_map[term] = math.log((self.total_docs + 1) / (count + 1)) + 1.0
        return self

    def transform_single(self, text: str) -> Dict[str, float]:
        tokens = tokenize(text)
        grams = extract_ngrams(tokens, self.ngram_range)
        if not grams:
            return {}

        tf_map: Dict[str, int] = {}
        for g in grams:
            tf_map[g] = tf_map.get(g, 0) + 1

        vector: Dict[str, float] = {}
        sum_sq = 0.0
        for term, count in tf_map.items():
            tf = count / len(grams)
            idf = self.idf_map.get(term, math.log(self.total_docs + 2) + 1.0)
            tf_idf = tf * idf
            vector[term] = tf_idf
            sum_sq += tf_idf * tf_idf

        magnitude = math.sqrt(sum_sq) or 1.0
        for term in vector:
            vector[term] /= magnitude
        return vector

def compute_cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    if not vec1 or not vec2:
        return 0.0
    dot = sum(val * vec2.get(term, 0.0) for term, val in vec1.items())
    return max(0.0, min(1.0, float(dot)))

def calculate_text_similarity(text1: str, text2: str, ngram_range: Tuple[int, int] = (1, 2)) -> float:
    # Pure-Python in-house vectorizer: 100% portable, instant, zero external C-extension or API dependencies
    vectorizer = PureTfIdfVectorizer(ngram_range=ngram_range).fit([text1, text2])
    v1 = vectorizer.transform_single(text1)
    v2 = vectorizer.transform_single(text2)
    return compute_cosine_similarity(v1, v2)
