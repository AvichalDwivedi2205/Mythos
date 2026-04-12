# Product Features

## Product Summary

This product is an AI-powered system design interview room where a candidate interacts with:

- an **Interviewer Agent** that runs the formal interview, nudges the candidate when needed, and applies calibrated stress
- a **Teammate Agent** with a fixed specialization who collaborates, challenges assumptions, and can ask the interviewer for clarification

The product is not just a chat interface. It is a **standardized multi-agent interview simulator plus evidence-backed evaluation system** that generates a final report and PDF.

## Core Value Proposition

- realistic system design interview simulation
- standardized interviewer behavior across candidates
- teammate-driven collaborative pressure
- measurable technical, communication, and collaboration signals
- evidence-backed final report instead of generic feedback

## Primary Users

- candidates practicing system design interviews
- recruiters and hiring teams reviewing interview outcomes
- mentors or educators running structured mock interviews
- hackathon judges evaluating an agentic AI product with clear real-world use

## Core UI-Led Experience

### 1. Dual-Channel Interview Room

The candidate sees two conversation tabs:

- `Interviewer`
- `Teammate`

This creates two distinct interaction lanes:

- a formal interview lane
- a specialist collaboration lane

The system keeps both lanes synchronized so the interviewer and teammate react to the same evolving design.

### 2. Phase-Based Interview Flow

The session follows a visible phase rail:

- Problem Framing
- Requirements
- High-Level Design
- Deep Dive
- Stress & Defense
- Wrap-Up

This makes the interview feel structured and standardized instead of like an open-ended chatbot.

### 3. Interviewer Nudges

The interviewer can redirect the candidate when they are drifting or leaving important gaps.

Examples:

- reminding the candidate to clarify requirements before solutioning
- asking how an ordering guarantee is actually achieved
- pushing the candidate to justify a storage or routing choice

Nudges should guide the candidate back to a better reasoning path without directly giving away the solution.

### 4. Calibrated Stress

The interviewer introduces realistic pressure throughout the interview.

Examples:

- scale spikes
- failure injections
- contradiction checks
- prioritization under time pressure
- detailed “why did you choose this?” probing

Stress is deliberate and standardized so it is useful for evaluation and not just theatrics.

### 5. Specialist Teammate Agent

The teammate behaves like a strong collaborator with a specific specialization, such as:

- backend
- data
- SRE / infra
- security
- product

The teammate can:

- challenge weak assumptions
- raise system-specific risks
- discuss alternatives
- ask the interviewer for clarification if scope is ambiguous

### 6. Teammate-to-Interviewer Coordination

The teammate is allowed to ask the interviewer for clarification when needed.

Examples:

- whether multi-region is in scope
- whether consistency can be relaxed
- whether latency or simplicity should be prioritized

This makes the discussion feel much more realistic than two isolated bots.

### 7. Agent Presence and Mode Display

The room shows who is active and how they are behaving right now.

Examples:

- interviewer mode: `probe`, `nudge`, or `stress`
- teammate specialization: `SRE`, `backend`, etc.
- live presence / thinking pulse

This helps the candidate understand the room context without exposing hidden scoring logic.

### 8. Live Signals

The UI includes a lightweight live signals panel showing:

- requirements
- architecture
- tradeoffs
- collaboration
- nudges given

These are not the final hiring scores. They are candidate-facing progress signals that make the room feel live and intelligent.

### 9. Inline Interaction Markers

The transcript should visibly mark important interaction types.

Examples:

- `Brief`
- `Nudge`
- `Stress`
- `Concern raised`
- `Clarification`

These markers make the interview easier to follow and later easier to evaluate.

### 10. Private Scratch Pad

The candidate has a persistent scratch pad for:

- requirements
- constraints
- open questions
- design notes

The scratch pad should remain private and should not automatically influence evaluation.

### 11. Manual End Session

The candidate can end the session explicitly.  
The system should also support the session ending when time expires.

### 12. Final Report and PDF

At the end of the session, the system generates:

- a structured report
- evidence-backed flagged moments
- rubric-style metrics
- a final recommendation
- a downloadable PDF

## Evaluation Features

### 1. Full Interaction Tracking

The system logs:

- candidate messages
- interviewer messages
- teammate messages
- clarifications
- nudges
- stress events
- teammate concerns
- design revisions
- contradictions
- phase transitions

### 2. Evidence-Based Scoring

The system evaluates:

- requirement discovery
- architecture quality
- tradeoff reasoning
- communication clarity
- collaboration quality
- stress handling
- consistency
- assistance dependency

Every major finding should map to real conversation evidence.

### 3. Guidance Dependency Tracking

The system should distinguish between:

- self-driven progress
- interviewer-induced progress
- teammate-induced progress

This is important because a candidate who reaches a good solution only after repeated nudges should be evaluated differently from a candidate who drives the solution independently.

### 4. Hint / Answer Fishing Detection

The system should track if the candidate repeatedly tries to extract the answer from the interviewer or teammate rather than reasoning through the problem.

This should be treated as a risk signal, not a simplistic cheating label.

## Session Modes

### Assessment Mode

- stricter interviewer behavior
- minimal help
- strongest focus on standardized evaluation

### Practice Mode

- more nudging allowed
- teammate slightly more collaborative
- final report shows guidance dependency

### Coaching Mode

- more help allowed
- best for learning and repetition
- report should clearly mark the session as assisted

## Standardization Features

To keep interviews comparable across candidates, the system should standardize:

- scenario pack
- rubric version
- interviewer persona
- teammate specialization boundaries
- stress frequency and intensity
- clarification policy
- mode behavior

## What Makes This Different

Most mock interview tools offer chat plus generic feedback. This product is stronger because it combines:

- a realistic multi-agent room
- separate interviewer and teammate channels
- standardized nudging and stress
- teammate-to-interviewer coordination
- candidate-visible progress signals
- citation-based final reporting

## Hackathon MVP Scope

The highest-signal hackathon version should include:

- one interview domain: system design
- one polished interview room
- one interviewer persona
- two or three teammate specializations
- dual-channel conversation
- private scratch pad
- event markers for nudge / stress / concern
- live signals popup
- final report generation
- PDF export

## Intentionally Deferred For Hackathon

- full auth
- voice mode
- organization dashboards
- long-term candidate profiles
- cross-session analytics
- company-specific knowledge bases
- graph database integrations

## Product Principle

The live room should feel like a real, high-pressure, collaborative interview.  
The final report should feel like a fair, explainable evaluation, not a vague AI opinion.
