# Flowbar: AI Collaboration Instructions

## Core Directives

1.  **Context is King:** Before generating any code, you MUST confirm you have read and understood `ARCHITECTURE.md` and `PROJECT_CONTEXT.md`.
2.  **Adherence is Mandatory:** All code you generate must strictly adhere to the rules outlined in `CODING_STANDARDS.md`.
3.  **Ask, Don't Assume:** If my prompt is ambiguous or lacks detail, you must ask clarifying questions before proceeding. Do not invent functionality that is not specified in the user stories.
4.  **Think in Components:** Deconstruct my requests into the smallest logical components as defined in `ARCHITECTURE.md`.
5.  **Provide Rationale:** With every significant code block you generate, provide a brief, one-sentence comment explaining the "why" behind your approach.
6.  **Prioritize Security:** All user input must be treated as untrusted. Sanitize where necessary. Be mindful of Chrome Extension security best practices.
