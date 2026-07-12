🎯 **What:** This PR addresses a testing gap in the DOM manipulation logic for the `generatePoem` feature. The previous codebase lacked tests to ensure that the UI properly updates during the loading state and correctly displays the generated poem.

📊 **Coverage:** The added tests cover the following scenarios:
1. `generatePoem fetches from Gemini and updates DOM`: Verifies the initial state, loading state (e.g., loader spinner appearing, semi-transparent box), and the final state when the mocked Gemini API responds successfully.
2. `generatePoem handles API error gracefully`: Validates that the UI handles API failures elegantly without crashing and displays a user-friendly error message.

✨ **Result:** Increased test coverage for DOM manipulation paths in `index.html`, resulting in higher code reliability and confidence for future refactoring efforts. The tests use an optimal external CDN blocking strategy for reliability.
