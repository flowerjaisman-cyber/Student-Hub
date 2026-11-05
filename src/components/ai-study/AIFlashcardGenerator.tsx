import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Check,
  Flag,
  Bookmark,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { FlashcardCard } from '../../types/index.ts';
import { generateFlashcards, executeAIProposedAction } from '../../services/aiStudyService.ts';
import { ActiveContext } from './AIContextSelector.tsx';
import { AIActionConfirmationModal } from './AIActionConfirmationModal.tsx';

interface AIFlashcardGeneratorProps {
  userId: string;
  activeContext: ActiveContext;
  onSuccessToast?: (msg: string) => void;
}

export const AIFlashcardGenerator: React.FC<AIFlashcardGeneratorProps> = ({
  userId,
  activeContext,
  onSuccessToast,
}) => {
  const [cardCount, setCardCount] = useState<number>(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deck state
  const [deckTitle, setDeckTitle] = useState<string>('');
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!activeContext.content || activeContext.content.trim().length === 0) {
      setErrorMsg('Please select or paste study material context before generating flashcards.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const res = await generateFlashcards(
        activeContext.content,
        activeContext.title,
        cardCount
      );

      if (!res.cards || res.cards.length === 0) {
        throw new Error('No flashcards could be extracted from this text.');
      }

      setDeckTitle(res.deckTitle || `${activeContext.title} Flashcards`);
      setCards(res.cards);
    } catch (err: any) {
      console.error('Flashcard generation failed:', err);
      setErrorMsg(err.message || 'Failed to generate flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // Wrap around
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(cards.length - 1);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const toggleMarkKnown = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, known: !c.known, markedForReview: false }
          : c
      )
    );
  };

  const toggleMarkReview = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, markedForReview: !c.markedForReview, known: false }
          : c
      )
    );
  };

  const handleConfirmSaveDeck = async () => {
    if (cards.length === 0) return;
    setIsSaving(true);
    try {
      await executeAIProposedAction(userId, {
        id: `act_${Date.now()}`,
        type: 'save_flashcards',
        title: `Save Deck: ${deckTitle}`,
        description: `Save ${cards.length} revision cards to My Study Materials.`,
        payload: {
          title: deckTitle,
          cards,
          sourceContext: {
            type: activeContext.type as any,
            sourceTitle: activeContext.title,
            sourceId: activeContext.id,
          },
        },
      });
      setConfirmModalOpen(false);
      onSuccessToast?.('Flashcard deck saved to My Study Materials!');
    } catch (err: any) {
      console.error('Failed to save flashcards:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentCard = cards[currentIndex];
  const knownCount = cards.filter((c) => c.known).length;
  const reviewCount = cards.filter((c) => c.markedForReview).length;

  return (
    <div className="space-y-6">
      {/* 1. Generator Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Flashcard Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform study materials into high-retention active recall cards
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !activeContext.content}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs shadow-teal-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Cards...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Flashcards</span>
              </>
            )}
          </button>
        </div>

        {/* Configuration settings */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Deck Size:
            </span>
            <div className="flex items-center gap-2">
              {[5, 8, 12, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCardCount(num)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold text-center transition-colors cursor-pointer ${
                    cardCount === num
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {num} Cards
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Interactive Flashcard Deck View */}
      {cards.length > 0 && currentCard && (
        <div className="space-y-4">
          {/* Deck Header & Stats */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {deckTitle}
              </h4>
              <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                Card {currentIndex + 1} of {cards.length}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                <Check className="w-3.5 h-3.5" />
                <span>{knownCount} Known</span>
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                <Flag className="w-3.5 h-3.5" />
                <span>{reviewCount} Review</span>
              </span>
              <button
                type="button"
                onClick={handleShuffle}
                title="Shuffle Deck"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Flashcard */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer select-none group relative w-full h-80 rounded-3xl p-8 border-2 border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition-all flex flex-col justify-between text-center"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>{isFlipped ? 'Back / Answer' : 'Front / Question'}</span>
              <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform" />
                <span>Click to Flip</span>
              </span>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </div>

              {isFlipped && currentCard.sourceReference && (
                <div className="mt-3 text-xs text-slate-400 italic">
                  Ref: {currentCard.sourceReference}
                </div>
              )}
            </div>

            {/* Bottom status badges */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                Space or click to flip • Arrows to navigate
              </span>
              <div className="flex items-center gap-2">
                {currentCard.known && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Marked Known
                  </span>
                )}
                {currentCard.markedForReview && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    Needs Review
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleMarkKnown(currentCard.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  currentCard.known
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Mark Known</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMarkReview(currentCard.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  currentCard.markedForReview
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Flag className="w-4 h-4" />
                <span>Review Later</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Previous card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Next card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setConfirmModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs shadow-teal-600/30 transition-all cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save Deck</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <AIActionConfirmationModal
          isOpen={confirmModalOpen}
          action={{
            id: `act_${Date.now()}`,
            type: 'save_flashcards',
            title: `Save Flashcard Deck: ${deckTitle}`,
            description: `Store this set of ${cards.length} revision flashcards in My Study Materials.`,
            payload: {
              title: deckTitle,
              cards,
            },
          }}
          onConfirm={handleConfirmSaveDeck}
          onCancel={() => setConfirmModalOpen(false)}
          isExecuting={isSaving}
        />
      )}
    </div>
  );
};
