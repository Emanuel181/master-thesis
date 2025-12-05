export async function formatCode(code, language) {
  console.log(`[API Formatter] 📡 Sending '${language}' code to backend (${code.length} characters)...`);

  try {
    const response = await fetch('/api/format-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[API Formatter] ❌ Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response. Check server logs for details.');
    }

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`[API Formatter] ✅ Backend returned formatted code (${data.formattedCode.length} characters)`);
      return data.formattedCode;
    }

    // Include details in error message if available
    const errorMessage = data.details
      ? `${data.error}: ${data.details}`
      : (data.error || 'Failed to format code');
    throw new Error(errorMessage);
  } catch (error) {
    console.error('[API Formatter] ❌ Error:', error.message);
    throw error; // Re-throw so calling code knows formatting failed
  }
}
