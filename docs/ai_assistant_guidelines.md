# AI Assistant Guidelines for AITutor Project

## Best Practices for Working with AI Assistant

This document outlines the best practices for effectively collaborating with the AI Assistant on the AITutor project. Following these guidelines will help maintain code quality and prevent unintended changes.

### 1. Making Specific Changes

When requesting changes to the codebase, use this format:
```
Please make the following specific change to [filename]:
- Add/modify [exact function/line]
- Do not touch any other code
```

**Example:**
```
Please make the following specific change to chat.js:
- Add a new method called handleBookmark() to the ChatManager class
- Do not modify any existing methods
```

### 2. Code Review Process

Before implementing changes, request a review:
```
Before making any changes:
1. Show me the current state of [filename]
2. Explain what changes you plan to make
3. Wait for my confirmation before proceeding
```

**Example:**
```
Before adding the bookmark feature:
1. Show me the current state of chat.js
2. Explain the planned bookmark implementation
3. Wait for my approval before making changes
```

### 3. Incremental Development

Break down complex changes into manageable steps:
```
Let's work on this step by step:
1. First, let's only modify [specific part]
2. Show me the result
3. Then we'll decide on next steps
```

**Example:**
```
Let's implement the bookmark feature step by step:
1. First, let's only add the bookmark button UI
2. Show me how it looks
3. Then we'll implement the click handler
```

### 4. Preserving Working Features

When making changes, explicitly state what should remain unchanged:
```
Important: The following features are working and should not be modified:
- [list working features]
Please make changes while preserving these functionalities
```

**Example:**
```
Important: The following features are working and should not be modified:
- Chat message sending/receiving
- Theme switching
- Profile management
Please add bookmarks while preserving these functionalities
```

### 5. Error Resolution

When encountering errors, follow this structured approach:
```
I'm seeing this error: [error message]
1. First, show me the relevant files
2. Explain what might be causing it
3. Propose a minimal fix
4. Wait for my approval before making changes
```

**Example:**
```
I'm seeing this error: "ChatManager is not defined"
1. Show me app.js and chat.js
2. Explain why ChatManager might be undefined
3. Propose how to fix the import/loading order
4. Wait for approval before making changes
```

## Benefits of Following These Guidelines

1. **Minimal Changes**: Changes are targeted and specific
2. **Code Preservation**: Working features remain intact
3. **Better Understanding**: Context is established before changes
4. **Quality Control**: Changes can be reviewed and approved
5. **Error Prevention**: Systematic approach to problem-solving

## Additional Tips

1. Always provide error messages exactly as they appear
2. Specify file paths and line numbers when relevant
3. Mention any dependencies or related files that might be affected
4. If unsure about a change, ask for clarification before proceeding

## Project-Specific Guidelines

1. Frontend changes:
   - Maintain existing UI/UX patterns
   - Preserve theme compatibility
   - Keep responsive design intact

2. Backend changes:
   - Follow existing API patterns
   - Maintain error handling consistency
   - Preserve security measures

3. Documentation:
   - Update relevant documentation when making changes
   - Add comments for complex logic
   - Keep README up to date

## Version Control Best Practices

1. Make atomic commits
2. Use clear commit messages
3. Test changes before committing
4. Document significant changes

---

*Note: This document should be updated as new best practices emerge or project requirements change.*
