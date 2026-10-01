import React, { useState } from 'react';
import { DAILY_CONTENT, DailyTafsirEntry } from './dailyContent';
import { getLondonDayNumber, getLondonDateString, findContentForDay } from './dateUtils';
import { Check, Copy, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function App() {
  const todayDayNumber = getLondonDayNumber();
  const todayLondonDate = getLondonDateString();

  const [currentDay, setCurrentDay] = useState<number>(todayDayNumber);
  const [copied, setCopied] = useState<boolean>(false);

  // calendar date → calculate day number → find that day's content → display it
  const entry: DailyTafsirEntry | undefined = findContentForDay(currentDay);

  const maxDay = Math.max(DAILY_CONTENT.length, todayDayNumber);
  const hasPrevious = currentDay > 1;
  const hasNext = currentDay < maxDay;

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentDay((prev) => prev - 1);
      setCopied(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentDay((prev) => prev + 1);
      setCopied(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReturnToToday = () => {
    setCurrentDay(todayDayNumber);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatSurahReference = (item: DailyTafsirEntry) => {
    if (item.ayahStart === item.ayahEnd) {
      return `Surah ${item.surahName} (${item.surahNumber}:${item.ayahStart})`;
    }
    return `Surah ${item.surahName} (${item.surahNumber}:${item.ayahStart}–${item.ayahEnd})`;
  };

  const handleCopy = async () => {
    if (!entry) return;

    const reference = formatSurahReference(entry);
    const arabicText = entry.arabic?.trim() || 'Arabic text has not yet been verified for this passage.';
    const explanationText = entry.simpleExplanation?.trim() || 'Simple explanation has not yet been provided.';
    const tafsirText = entry.ibnKathirSummary?.trim() || 'Tafsir Ibn Kathir summary has not yet been provided.';

    const socialText = [
      `🌱 Today's Theme: ${entry.theme}`,
      '',
      reference,
      '',
      arabicText,
      '',
      'Simple Explanation:',
      explanationText,
      '',
      'Tafsir Ibn Kathir:',
      tafsirText,
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(socialText);
      } else {
        // Fallback for older browsers or restricted environments
        const textArea = document.createElement('textarea');
        textArea.value = socialText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      // Graceful fallback if copy fails
      setCopied(false);
    }
  };

  if (!entry) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-800">
        <div className="max-w-md w-full bg-white p-8 border border-stone-200 rounded-lg text-center shadow-xs">
          <h1 className="text-xl font-serif font-bold text-stone-900 mb-2">Daily Tafsir</h1>
          <p className="text-stone-600 mb-4">No content available for this day.</p>
          <button
            onClick={handleReturnToToday}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            Return to Today
          </button>
        </div>
      </main>
    );
  }

  const isBrowsingOtherDay = entry.day !== todayDayNumber;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 py-10 px-4 sm:px-6">
      <main className="max-w-2xl mx-auto">
        {/* Top Header */}
        <header className="mb-8 border-b border-stone-200 pb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-stone-900">
                Daily Tafsir
              </h1>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>UK Date: {todayLondonDate}</span>
                <span>·</span>
                <span>London Timezone</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-base sm:text-lg font-serif font-bold text-stone-800 block">
                Day {entry.day}
              </span>
              {isBrowsingOtherDay ? (
                <button
                  onClick={handleReturnToToday}
                  className="text-xs text-amber-800 underline underline-offset-2 hover:text-amber-950 transition-colors"
                  title="Return to today's passage"
                >
                  Return to Today (Day {todayDayNumber})
                </button>
              ) : (
                <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                  Today&apos;s Entry
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content Card */}
        <article className="bg-white border border-stone-200 rounded-xl p-6 sm:p-9 shadow-xs space-y-8">
          
          {/* Section: Today's Theme */}
          <section aria-labelledby="theme-heading">
            <h2 id="theme-heading" className="text-xs uppercase tracking-widest text-stone-500 font-semibold mb-1">
              Today&apos;s Theme
            </h2>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {entry.theme || 'Reflection'}
            </p>
          </section>

          <hr className="border-stone-100" />

          {/* Section: Qur'an */}
          <section aria-labelledby="quran-heading" className="space-y-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 id="quran-heading" className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
                Qur&apos;an
              </h2>
              <p className="text-sm font-serif font-medium text-stone-700">
                {formatSurahReference(entry)}
              </p>
            </div>

            {/* Verified Arabic Text */}
            <div
              dir="rtl"
              lang="ar"
              className="font-arabic text-2xl sm:text-3xl leading-[2.2] sm:leading-[2.4] text-stone-900 text-right p-5 sm:p-6 bg-stone-50 rounded-lg border border-stone-200/80 select-text"
            >
              {entry.arabic?.trim() ? (
                entry.arabic
              ) : (
                <p dir="ltr" className="text-sm font-sans text-stone-500 text-center italic py-2">
                  Arabic text has not yet been verified for this passage.
                </p>
              )}
            </div>

            {/* Approved Translation */}
            <div className="pt-2">
              <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2">
                Translation
              </h3>
              {entry.translation?.trim() ? (
                <p className="text-stone-700 leading-relaxed font-serif text-base sm:text-lg italic">
                  &ldquo;{entry.translation}&rdquo;
                </p>
              ) : (
                <p className="text-sm text-stone-500 italic">
                  Approved translation has not yet been provided.
                </p>
              )}
            </div>
          </section>

          <hr className="border-stone-100" />

          {/* Section: Context */}
          <section aria-labelledby="context-heading" className="space-y-2">
            <h2 id="context-heading" className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
              Context
            </h2>
            {entry.context?.trim() ? (
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                {entry.context}
              </p>
            ) : (
              <p className="text-sm text-stone-500 italic">
                Additional context has not been provided for this passage.
              </p>
            )}
          </section>

          <hr className="border-stone-100" />

          {/* Section: Simple Explanation */}
          <section aria-labelledby="explanation-heading" className="space-y-2">
            <h2 id="explanation-heading" className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
              Simple Explanation
            </h2>
            {entry.simpleExplanation?.trim() ? (
              <p className="text-stone-800 leading-relaxed text-sm sm:text-base">
                {entry.simpleExplanation}
              </p>
            ) : (
              <p className="text-sm text-stone-500 italic">
                Simple explanation has not yet been provided.
              </p>
            )}
          </section>

          <hr className="border-stone-100" />

          {/* Section: Tafsir Ibn Kathir */}
          <section aria-labelledby="ibnkathir-heading" className="space-y-2">
            <h2 id="ibnkathir-heading" className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
              Tafsir Ibn Kathir — Summary
            </h2>
            {entry.ibnKathirSummary?.trim() ? (
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                {entry.ibnKathirSummary}
              </p>
            ) : (
              <p className="text-sm text-stone-500 italic">
                Tafsir Ibn Kathir summary has not yet been provided.
              </p>
            )}
          </section>

          <hr className="border-stone-100" />

          {/* Section: Copy for Social Media */}
          <section aria-labelledby="copy-heading" className="pt-2">
            <button
              id="copy-heading"
              type="button"
              onClick={handleCopy}
              className={`w-full py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2 border shadow-xs min-h-[46px] cursor-pointer ${
                copied
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-stone-900 text-stone-50 hover:bg-stone-800 border-stone-900 active:bg-stone-950'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-300" />
                  <span>Copy for Social Media</span>
                </>
              )}
            </button>
          </section>

          {/* Section: Navigation (Previous | Next) */}
          <nav aria-label="Passage navigation" className="pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className={`flex items-center gap-1.5 py-2.5 px-4 rounded-md text-sm font-medium min-h-[44px] border transition-colors ${
                  hasPrevious
                    ? 'border-stone-300 text-stone-800 bg-white hover:bg-stone-50 cursor-pointer'
                    : 'border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-stone-500 font-mono">
                Day {entry.day} of {maxDay}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className={`flex items-center gap-1.5 py-2.5 px-4 rounded-md text-sm font-medium min-h-[44px] border transition-colors ${
                  hasNext
                    ? 'border-stone-300 text-stone-800 bg-white hover:bg-stone-50 cursor-pointer'
                    : 'border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </article>

        {/* Footer info note */}
        <footer className="mt-8 text-center text-xs text-stone-400 font-serif">
          Daily Tafsir &mdash; Curated Daily Verses & Authentic Classical Reflections
        </footer>
      </main>
    </div>
  );
}
