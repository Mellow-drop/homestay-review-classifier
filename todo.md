# Homestay Review Sentiment Classifier - Project TODO

## Core Features
- [x] Database schema for storing classified reviews and sessions
- [x] Review input UI with single and batch input modes
- [x] LLM integration for sentiment classification, theme tagging, and response generation
- [x] Results table with sortable columns and sentiment badges
- [x] Copy-to-clipboard action for individual suggested responses
- [x] Loading and error states with per-review progress indication
- [x] Database persistence for classified review sessions
- [x] CSV export functionality for results table
- [x] Test report tab with 20 simulated reviews and accuracy validation
- [x] Elegant, polished visual design with refined typography and whitespace

## Technical Requirements
- [x] Sentiment values: exactly "positive", "neutral", "negative"
- [x] **Post-Migration UI & API Key Enhancements**
  - [x] Configure the new `GEMINI_API_KEY` in `.env` and `api/index.py`
  - [x] Remove the Gemini 1.5 Flash Analytics Engine badge from the Home page hero section
  - [x] Redesign Classifier output results table to be full-width and wrap review text/replies to prevent squishing
  - [x] Refactor Classifier input panel to be collapsible when results are loaded
  - [x] Redesign History Logs table columns to be full-width with text-wrapping, matching the new Classifier style
  - [x] Redesign Classifier Verification Suite (TestReport) table to prevent review text truncation and squishing
  - [x] Verify that the codebase builds and compiles with zero TypeScript errors
- [x] Theme tags: food, host, location, cleanliness, value, experience
- [x] Sentiment displayed as badge (not plain text)
- [x] Copy action on individual responses (not entire table)
- [x] Batch processing with per-review progress indication
- [x] Error handling for LLM API failures
- [x] Session persistence and retrieval

## Testing & Validation
- [x] Create 20 simulated reviews for test report
- [x] Validate classifier accuracy on test dataset
- [x] Test batch processing with various review counts
- [x] Test CSV export functionality
- [x] Test session persistence and retrieval
- [x] Unit tests for review classification (9 tests, all passing)

## Remaining Gaps & Improvements
- [x] Implement per-review batch progress tracking with individual status indicators
- [x] Add session history UI to list and reopen past classification sessions
- [x] Add automated tests for CSV export functionality
- [x] Add batch processing tests for multiple batch sizes and edge cases
- [x] Add end-to-end persistence/retrieval tests for sessions

## Completed
