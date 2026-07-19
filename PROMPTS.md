# PROMPTS.md — AI Prompt Engineering Log

## Feature: Guest Review Sentiment Classifier & Response Generator

**App:** SentiNest — Homestay Review Intelligence Dashboard  
**AI API:** Google Gemini (`gemini-1.5-flash`)  
**Endpoint:** `POST /api/classify`  
**Task:** Classify guest reviews by sentiment (positive/neutral/negative), identify operational themes, generate a suggested management response, and flag urgency for escalation.

---

## Prompt Variation 1 — Simple Instruction (Baseline)

### Prompt
```
Classify the following guest review.
Return: sentiment (positive/neutral/negative), theme (food/host/location/cleanliness/value/experience), and a short management reply.

Review: "The bathroom was dirty and the room smelled bad. Very disappointed."
```

### Output
```json
{
  "sentiment": "negative",
  "theme": "cleanliness",
  "response": "We apologize for the inconvenience."
}
```

### Evaluation
❌ **Did not work well.** The response was too short and generic ("We apologize for the inconvenience") and did not follow a consistent JSON structure. When batching multiple reviews, the model would sometimes skip reviews or merge them. There was no urgency detection and no handling of multi-theme reviews.

---

## Prompt Variation 2 — Structured JSON with Role + Schema

### Prompt
```
You are a hotel operations analyst. Classify each guest review below and return a JSON array.

Each object must contain:
- sentiment: "positive", "neutral", or "negative"
- theme: one of "food", "host", "location", "cleanliness", "value", "experience"
- response: a 1-sentence professional management reply (15-25 words)
- urgencyLevel: "low", "medium", or "high"
- needsEscalation: true or false

Reviews:
[
  {"id": 0, "text": "The host was rude and unhelpful."},
  {"id": 1, "text": "Beautiful views, great breakfast!"}
]
```

### Output
```json
[
  {
    "id": 0,
    "sentiment": "negative",
    "theme": "host",
    "response": "We sincerely apologize for the service experience and will address this with our team.",
    "urgencyLevel": "medium",
    "needsEscalation": false
  },
  {
    "id": 1,
    "sentiment": "positive",
    "theme": "location",
    "response": "Thank you! We are so glad you enjoyed the views and our breakfast offerings.",
    "urgencyLevel": "low",
    "needsEscalation": false
  }
]
```

### Evaluation
✅ **Significant improvement.** The structured schema and role assignment ("hotel operations analyst") produced consistent, professional responses. However, the model only picked one theme per review even when multiple were present (e.g., "location" was picked over "food" for review 1 which mentions both views and breakfast). Multi-theme detection was still missing.

---

## Prompt Variation 3 — Final Production Prompt (Best)

### Prompt
```
You are an expert hospitality analyst. Classify guest reviews with precision.

You will receive a JSON list of objects, each with an 'id' and 'text'. 
You must return a JSON array containing EXACTLY ONE classification object for EVERY input review.

If a single review mentions multiple themes (e.g. food and cleanliness), you MUST include ALL of them 
in the 'theme' array field within the SAME object.

Each object must contain these exact fields:
- id: The exact integer 'id' of the input review you are classifying.
- sentiment: one of "positive", "neutral", or "negative"
- theme: a JSON ARRAY of strings (one or more of "food", "host", "location", "cleanliness", "value", "experience")
- response: a one-line suggested management response (professional, empathetic, 15-25 words)
- urgencyLevel: "low", "medium", or "high" (high for severe complaints or safety issues)
- needsEscalation: true or false (true only if urgencyLevel is high)

Guidelines for Themes:
- 'food': references to meals, breakfast, dining, dishes, ingredients.
- 'host': references to staff, service, check-in interactions, friendliness, or helpfulness.
- 'location': references to geographic location, views, noise, distance to town.
- 'cleanliness': references to room tidiness, bathroom conditions, smell, dirty, maintenance.
- 'value': references to cost, price, expensive, value for money.
- 'experience': general stay reviews that reflect the overall stay rather than a single topic.

Example Input:
[
  {"id": 0, "text": "The food was great!"},
  {"id": 1, "text": "Room was dirty."}
]

Example Output:
[
  {"id": 0, "sentiment": "positive", "theme": ["food"], "response": "We're so glad you enjoyed our breakfast! Hope to see you again soon.", "urgencyLevel": "low", "needsEscalation": false},
  {"id": 1, "sentiment": "negative", "theme": ["cleanliness", "experience"], "response": "We apologize for the room condition and have addressed this with our cleaning staff.", "urgencyLevel": "medium", "needsEscalation": false}
]
```

### Output
```json
[
  {
    "id": 0,
    "sentiment": "positive",
    "theme": ["food"],
    "response": "We are thrilled you enjoyed our breakfast! We look forward to welcoming you back soon.",
    "urgencyLevel": "low",
    "needsEscalation": false
  },
  {
    "id": 1,
    "sentiment": "negative",
    "theme": ["cleanliness", "experience"],
    "response": "We sincerely apologize for the room conditions and have immediately addressed this with our housekeeping team.",
    "urgencyLevel": "medium",
    "needsEscalation": false
  }
]
```

### Evaluation
✅✅ **Best performing prompt.** Three key improvements made this the production choice:

1. **Multi-theme support**: Changing `theme` from a single string to a JSON array and explicitly instructing the model to include ALL applicable themes solved the single-theme limitation in Variation 2.
2. **Few-shot examples**: Adding a concrete input/output example pair at the end of the prompt drastically reduced hallucinations and enforced consistent JSON structure across batches of 10+ reviews.
3. **Strict ID tracking**: Requiring the model to return the exact integer `id` for each review ensured that results could be reliably matched back to the original input order, which was critical for the batch processing pipeline.

---

## Summary Table

| Variation | Structure | Multi-Theme | Urgency | Consistency | Chosen? |
|---|---|---|---|---|---|
| Variation 1 | Freeform | ❌ | ❌ | ❌ | ❌ |
| Variation 2 | JSON Schema + Role | ❌ (single only) | ✅ | ✅ | ❌ |
| Variation 3 | JSON Array + Role + Few-shot | ✅ | ✅ | ✅✅ | ✅ **Production** |

---

## System Prompt / Role Used

```
"You are an expert hospitality analyst. Classify guest reviews with precision."
```

This role assignment was kept consistent across all production requests. It anchors the model's persona to the hospitality domain, which improved the empathy and professionalism of the generated management responses compared to a generic assistant role.

---

## API Configuration

| Setting | Value |
|---|---|
| Model | `gemini-1.5-flash` (via `gemini-3.5-flash` endpoint alias) |
| API Key Storage | `.env` → `GEMINI_API_KEY` (never committed) |
| Key in `.gitignore` | ✅ Verified |
| Batch Size | Up to 20 reviews per request |
| Fallback | Local heuristic classifier if API quota exceeded |
