# Story Bank — Master STAR+R Stories

This file accumulates your best interview stories over time. Each evaluation (Block F) adds new stories here. Instead of memorizing 100 answers, maintain 5-10 deep stories that you can bend to answer almost any behavioral question.

## How it works

1. Every time `/career-ops oferta` generates Block F (Interview Plan), new STAR+R stories get appended here
2. Before your next interview, review this file — your stories are already organized by theme
3. The "Big Three" questions can be answered with stories from this bank:
   - "Tell me about yourself" → combine 2-3 stories into a narrative
   - "Tell me about your most impactful project" → pick your highest-impact story
   - "Tell me about a conflict you resolved" → find a story with a Reflection

## Stories

<!-- Stories will be added here as you evaluate offers -->
<!-- Format:
### [Theme] Story Title
**Source:** Report #NNN — Company — Role
**S (Situation):** ...
**T (Task):** ...
**A (Action):** ...
**R (Result):** ...
**Reflection:** What I learned / what I'd do differently
**Best for questions about:** [list of question types this story answers]
-->

### [AI/LLM] FinBERT Multimodal Forecasting Pipeline
**Source:** Report #307 — Aurus, Inc. — Data Scientist (Internship)
**S (Situation):** Needed to predict next-trading-day post-earnings stock returns using a mix of unstructured (earnings call transcripts), structured (financial indicators), and social (Reddit sentiment) signals.
**T (Task):** Build a pipeline that turns long earnings-call transcripts into usable model inputs alongside the structured and sentiment features.
**A (Action):** Encoded transcripts with ProsusAI FinBERT in 256-512 token chunks, cached the frozen embeddings, and projected them into a shared multimodal embedding space; built a PyTorch cross-modal fusion model with multi-head attention and quantile prediction heads trained with pinball loss; applied conformalized quantile regression for calibrated prediction intervals.
**R (Result):** Produced calibrated 80/90/95% prediction intervals and benchmarked the model against single-modality ablations and same-ticker historical baselines using coverage, interval width, calibration error, MAE, RMSE, and directional accuracy.
**Reflection:** Embedding caching and chunking strategy mattered as much as the fusion architecture for making transformer-based training tractable on limited compute — engineering the data pipeline around a pretrained LLM is often the harder half of the problem.
**Best for questions about:** working with/training on top of LLMs, transformer embeddings, multimodal ML, PyTorch, model evaluation rigor

### [Production ML] Volvo ML Analytics Platform
**Source:** Report #307 — Aurus, Inc. — Data Scientist (Internship)
**S (Situation):** Engineering teams needed predictive insight from millions of vehicle sensor records to support test-readiness and design decisions.
**T (Task):** Build an end-to-end ML analytics platform linking complete vehicle modeling signals with that sensor data.
**A (Action):** Designed the platform, built and validated Random Forest models to predict truck component damage and acceleration, and integrated the models into engineering decision workflows (including GHG emissions estimation in Power BI).
**R (Result):** Models supported data-driven test-readiness decisions across vehicle platforms and configurations.
**Reflection:** Integration into existing decision workflows mattered as much as raw model accuracy — a model nobody acts on doesn't move anything.
**Best for questions about:** production ML on real/large datasets, end-to-end ownership, predictive modeling, "tell me about your most impactful project"

### [Impact/Automation] Volvo DMIS Automation
**Source:** Report #307 — Aurus, Inc. — Data Scientist (Internship)
**S (Situation):** A manual DMIS output-file generation workflow took 4 hours and was a bottleneck for distributed engineering teams.
**T (Task):** Automate the workflow end-to-end.
**A (Action):** Built a Streamlit-based automation tool with backend services in Python/Flask/PostgreSQL, deployed via Docker/Kubernetes/Argo CD (GitOps).
**R (Result):** Cut processing time from 4 hours to under 6 minutes, delivering ~$176,980/yr in annual operational savings.
**Reflection:** A small UI layer (Streamlit) made the difference between a backend automation tool that's technically correct and one that's actually adopted by non-technical engineers.
**Best for questions about:** quantified business impact, automation, full-stack ownership, "tell me about your most impactful project"
