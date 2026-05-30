// Translation service using MyMemory API (free, no auth required)

const MYMEMORY_API = "https://api.mymemory.translated.net/get";

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// Map language codes to full names for better UX
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  "en-US": "English",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "it-IT": "Italian",
  "pt-BR": "Portuguese",
  "ja-JP": "Japanese",
  "zh-CN": "Chinese (Simplified)",
  "ko-KR": "Korean",
  "ru-RU": "Russian",
  "hi-IN": "Hindi",
};

// Extract language code for API (e.g., 'en-US' -> 'en')
function getLanguageCode(locale: string): string {
  return locale.split("-")[0].toLowerCase();
}

export async function translateText(
  text: string,
  sourceLanguage: string = "auto",
  targetLanguage: string = "en"
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text to translate cannot be empty");
  }

  try {
    const sourceLang = getLanguageCode(sourceLanguage);
    const targetLang = getLanguageCode(targetLanguage);

    // Skip translation if source and target are the same
    if (sourceLang === targetLang) {
      return {
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      };
    }

    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    });

    const response = await fetch(`${MYMEMORY_API}?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(`Translation failed: ${data.responseDetails}`);
    }

    return {
      translatedText: data.responseData.translatedText,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

// Batch translate to multiple languages
export async function translateToMultipleLanguages(
  text: string,
  targetLanguages: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const translations = await Promise.allSettled(
    targetLanguages.map((lang) =>
      translateText(text, "auto", lang).then((result) => ({
        lang: result.targetLanguage,
        text: result.translatedText,
      }))
    )
  );

  translations.forEach((result) => {
    if (result.status === "fulfilled") {
      results[result.value.lang] = result.value.text;
    } else {
      console.error("Translation failed for language:", result.reason);
    }
  });

  return results;
}

// Debounce translation to avoid too many API calls
export function debounceTranslation(
  callback: (text: string) => void,
  delay: number = 1000
): (text: string) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (text: string) => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(text);
      timeoutId = null;
    }, delay);
  };
}
