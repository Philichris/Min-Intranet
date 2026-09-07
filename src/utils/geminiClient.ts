export async function callGeminiJson(prompt: string, systemInstruction?: string): Promise<any> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction })
    });
    const json = await res.json();
    if (json.success) {
      return json.data;
    } else {
      throw new Error(json.error || 'Erreur Gemini API');
    }
  } catch (err) {
    console.error('Gemini call error:', err);
    throw err;
  }
}
