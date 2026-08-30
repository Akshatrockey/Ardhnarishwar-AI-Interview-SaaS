"""
SQLAlchemy ORM Model: AIModelVersion
Tracks complete immutable model artifacts, dataset references, scoring matrices, and feature configs.
"""
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Index, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class AIModelVersion(Base):
    __tablename__ = "ai_model_versions"

    id = Column(String(64), primary_key=True) # e.g. "aiv_v3_4_0_robotics"
    version_tag = Column(String(50), nullable=False, unique=True) # e.g. "v3.4.0-robotics-core"
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    
    # 1. Dataset & Training Reference
    dataset_ref = Column(String(100), nullable=False) # e.g. "ds_robotics_kinematics_v2_1"
    dataset_version = Column(String(50), nullable=False) # e.g. "2.1.0"
    dataset_checksum = Column(String(64), nullable=False) # SHA-256 hash of dataset corpus
    
    # 2. Scoring Configuration (Dimension Multipliers & Thresholds)
    scoring_config = Column(JSON, nullable=False) # {"weights": {"technical": 0.45, "relevance": 0.30, "communication": 0.25}, "passing_threshold": 70.0}
    
    # 3. Feature Configuration (NLP tokenization, n-grams, WPM thresholds)
    feature_config = Column(JSON, nullable=False) # {"ngram_range": [1, 2], "min_wpm": 110, "max_wpm": 165, "hesitation_weight": 0.15}
    
    # 4. Model & Rule Configuration (Anti-patterns, STAR behavioral heuristics)
    rule_config = Column(JSON, nullable=False) # {"anti_pattern_penalty": 15.0, "star_weights": {"situation": 0.25, "task": 0.25, "action": 0.25, "result": 0.25}}
    
    # 5. Validation Benchmark Metrics
    evaluation_metrics = Column(JSON, nullable=False) # {"validation_accuracy": 0.942, "f1_score": 0.928, "rmse": 2.14}
    
    # 6. Status & Metadata
    is_active = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_by = Column(String(64), nullable=False, default="usr_super_admin")

    __table_args__ = (
        Index('idx_aiv_active', 'is_active'),
        Index('idx_aiv_tag', 'version_tag'),
    )
