// Google Translate website widget.
// Every page is written in Spanish; when the visitor picks another language the
// widget translates the rendered page in their browser. Nothing is stored.
import type { Language } from '../types';

const SOURCE: Language = 'es';
const COOKIE = 'googtrans';
const SCRIPT_URL = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

type GoogleTranslate = {
  translate: {
    TranslateElement: new (options: Record<string, unknown>, elementId: string) => unknown;
  };
};

declare global {
  interface Window {
    google?: GoogleTranslate;
    googleTranslateElementInit?: () => void;
  }
}

/** The widget reads/writes its choice in the `googtrans` cookie ("/es/en"). */
function writeCookie(value: string | null) {
  const host = location.hostname;
  // Google may also set it for the parent domain, so clear every variant
  for (const domain of ['', host, `.${host}`]) {
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}`;
  }
  if (value) document.cookie = `${COOKIE}=${value}; path=/`;
}

let loading: Promise<boolean> | null = null;

/** Loads the widget once. Resolves false if Google's script can't be reached. */
function loadWidget(): Promise<boolean> {
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const holder = document.createElement('div');
    holder.id = 'google_translate_element';
    holder.style.display = 'none';
    document.body.appendChild(holder);

    window.googleTranslateElementInit = () => {
      new window.google!.translate.TranslateElement(
        { pageLanguage: SOURCE, includedLanguages: 'en,es', autoDisplay: false },
        'google_translate_element',
      );
      resolve(true);
    };
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return loading;
}

/** Waits for the widget's hidden <select> (it appears shortly after init). */
async function findCombo(timeoutMs = 5000): Promise<HTMLSelectElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const combo = document.querySelector<HTMLSelectElement>('select.goog-te-combo');
    if (combo && combo.options.length > 1) return combo;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

const isTranslated = () =>
  document.documentElement.classList.contains('translated-ltr') ||
  document.documentElement.classList.contains('translated-rtl');

/**
 * Shows the site in `lang`. Spanish means the original page.
 * `initial` is used on page load, where the cookie alone is enough.
 */
export async function translateSite(lang: Language, initial = false) {
  if (lang === SOURCE) {
    writeCookie(null);
    // Google has no reliable "undo"; reloading shows the original Spanish page
    if (isTranslated()) location.reload();
    return;
  }

  writeCookie(`/${SOURCE}/${lang}`);
  const ok = await loadWidget();
  if (!ok || initial) return; // on load the widget applies the cookie by itself

  const combo = await findCombo();
  if (combo) {
    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
  } else {
    location.reload(); // the cookie is set, so the reloaded page comes translated
  }
}
