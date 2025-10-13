# Flowbar: Coding Standards

1.  **Language:** JavaScript (ES6+). Use `async/await` for all asynchronous operations.
2.  **Formatting:** All code will be formatted using Prettier with its default settings.
3.  **Linting:** ESLint will be used. We will use the `eslint:recommended` configuration.
4.  **Naming Conventions:**
    - `camelCase` for variables and functions (e.g., `startTimer`).
    - `UPPER_SNAKE_CASE` for constants (e.g., `FOCUS_DURATION`).
    - Use clear, descriptive names. `updateTimerDisplay` is better than `update()`.
5.  **Error Handling:**
    - All `chrome.*` API calls that return a promise must be wrapped in `try/catch` blocks.
    - Log errors clearly to the console with a prefix for easy debugging, e.g., `console.error("Flowbar background.js error:", error);`.
6.  **Comments:**
    - Use single-line `//` comments to explain _why_ a piece of code is doing something, not _what_ it is doing. The code should be self-explanatory about the "what."
    - Use JSDoc-style comments for complex functions to explain parameters and return values.
