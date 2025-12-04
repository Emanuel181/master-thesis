/**
 * Code formatting utility configuration for different languages
 */

/**
 * Get formatting options based on the programming language
 * @param {string} language - The programming language (javascript, python, go, java)
 * @returns {object} - Formatting configuration options
 */
export function getFormattingOptions(language) {
  const baseOptions = {
    tabSize: 2,
    insertSpaces: true,
  };

  switch (language) {
    case 'javascript':
    case 'typescript':
      return {
        ...baseOptions,
        tabSize: 2,
        insertSpaces: true,
        trimTrailingWhitespace: true,
      };

    case 'python':
      return {
        ...baseOptions,
        tabSize: 4,
        insertSpaces: true,
        trimTrailingWhitespace: true,
      };

    case 'java':
      return {
        ...baseOptions,
        tabSize: 4,
        insertSpaces: true,
        trimTrailingWhitespace: true,
      };

    case 'go':
      return {
        ...baseOptions,
        tabSize: 4,
        insertSpaces: false, // Go uses tabs
        trimTrailingWhitespace: true,
      };

    default:
      return baseOptions;
  }
}

/**
 * Format code using the backend API (Prettier) for supported languages
 * @param {string} code - The code to format
 * @param {string} language - The programming language
 * @returns {Promise<string|null>} - Formatted code or null if not supported
 */
export async function formatCodeWithAPI(code, language) {
  try {
    const response = await fetch('/api/format-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return data.formattedCode;
    }

    // If the API says to use Monaco, return null
    if (data.useMonaco) {
      return null;
    }

    throw new Error(data.error || 'Failed to format code');
  } catch (error) {
    console.error('API formatting error:', error.message);
    return null;
  }
}

/**
 * Format code using Monaco Editor's built-in formatter
 * This is a helper that can be called from the editor component
 */
export async function formatCodeWithMonaco(editor) {
  if (!editor) {
    throw new Error('Editor instance is required');
  }

  try {
    // Trigger Monaco's format document action
    const formatAction = editor.getAction('editor.action.formatDocument');

    if (formatAction) {
      await formatAction.run();
      return editor.getValue();
    } else {
      throw new Error('Format action not available');
    }
  } catch (error) {
    console.error('Monaco formatting error:', error.message);
    throw error;
  }
}

/**
 * Format code using the best available method for the language
 * - Uses Prettier via API for JavaScript/TypeScript
 * - Uses Monaco Editor for Python, Java, Go, etc.
 * @param {string} code - The code to format
 * @param {string} language - The programming language
 * @param {object} editor - Monaco editor instance
 * @returns {Promise<string>} - Formatted code
 */
export async function formatCode(code, language, editor) {
  // Try API formatting first for JavaScript/TypeScript
  if (language === 'javascript' || language === 'typescript') {
    const apiFormatted = await formatCodeWithAPI(code, language);
    if (apiFormatted) {
      return apiFormatted;
    }
    // Fall back to Monaco if API fails
    console.log('API formatting unavailable, using Monaco');
  }

  // Use Monaco Editor for all other languages or if API fails
  if (editor) {
    return await formatCodeWithMonaco(editor);
  }

  throw new Error('No formatter available');
}

