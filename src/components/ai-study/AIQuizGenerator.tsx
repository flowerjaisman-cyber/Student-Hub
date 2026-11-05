import React, { useState } from 'react';
import {
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Bookmark,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Eye,
  Settings2,
  AlertTriangle,
} from 'lucide-react';
import { QuizQuestion, QuizResult } from '../../types/index.ts';
import { generateQuiz, executeAIProposedAction } from '../../services/aiStudyService.ts';
import { ActiveContext } from './AIContextSelector.tsx';
import { AIActionConfirmationModal } from './AIActionConfirmationModal.tsx';

interface AIQuizGeneratorProps {
  userId: string;
  activeContext: ActiveContext;
  onSuccessToast?: (msg: string) => void;
}

export const AIQuizGenerator: React.FC<AIQuizGeneratorProps> = ({
  userId,
  activeContext,
  onSuccessToast,
}) => {
  // Configuration state
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'mixed' | 'multiple-choice' | 'true-false' | 'short-answer'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generated Quiz state
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Interactive Quiz Taking state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [immediateFeedback, setImmediateFeedback] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Action confirmation state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!activeContext.content || activeContext.content.trim().length === 0) {
      setErrorMsg('Please select or paste study material context before generating a quiz.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setQuizStarted(false);
    setQuizCompleted(false);
    setSelectedAnswers({});
    setCurrentIndex(0);

    try {
      const res = await generateQuiz(
        activeContext.content,
        activeContext.title,
        {
          count: questionCount,
          difficulty,
          questionType,
        }
      );

      if (!res.questions || res.questions.length === 0) {
        throw new Error('No questions could be generated from the provided text.');
      }

      setQuizTitle(res.quizTitle || `${activeContext.title} Quiz`);
      setQuestions(res.questions);
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      setErrorMsg(err.message || 'Failed to generate quiz. Try selecting different study text.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (qId: string, answer: string) => {
    if (quizCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setQuizCompleted(false);
    setQuizStarted(true);
  };

  // Score calculations
  const calculateResults = (): QuizResult => {
    let correct = 0;
    const answersBreakdown = questions.map((q) => {
      const userAns = (selectedAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      const isCorrect = userAns.length > 0 && userAns === correctAns;
      if (isCorrect) correct++;

      return {
        questionId: q.id,
        questionText: q.question,
        userAnswer: selectedAnswers[q.id] || 'Unanswered',
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const scorePct = Math.round((correct / questions.length) * 100);

    return {
      id: `qres_${Date.now()}`,
      quizTitle,
      totalQuestions: questions.length,
      correctAnswers: correct,
      scorePercentage: scorePct,
      timestamp: new Date().toISOString(),
      answers: answersBreakdown,
    };
  };

  const currentQ = questions[currentIndex];
  const results = quizCompleted ? calculateResults() : null;

  const handleConfirmSaveResult = async () => {
    if (!results) return;
    setIsSaving(true);
    try {
      await executeAIProposedAction(userId, {
        id: `act_${Date.now()}`,
        type: 'save_quiz_result',
        title: `Save Quiz Result: ${quizTitle}`,
        description: `Save this quiz score (${results.scorePercentage}%) and questions to My Study Materials.`,
        payload: {
          ...results,
          sourceContext: {
            type: activeContext.type as any,
            sourceTitle: activeContext.title,
            sourceId: activeContext.id,
          },
        },
      });
      setConfirmModalOpen(false);
      onSuccessToast?.('Quiz result saved to My Study Materials!');
    } catch (err: any) {
      console.error('Failed to save quiz result:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Generator Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Quiz Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate tailored multiple-choice, true/false, or mixed practice tests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !activeContext.content}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>

        {/* Configuration settings row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Number of Questions
            </label>
            <div className="flex items-center gap-2">
              {[3, 5, 10, 15].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-1.5 rounded-lg border font-semibold text-center transition-colors cursor-pointer ${
                    questionCount === num
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Difficulty
            </label>
            <div className="flex items-center gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 py-1.5 rounded-lg border capitalize font-semibold text-center transition-colors cursor-pointer ${
                    difficulty === diff
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
            >
              <option value="mixed">Mixed Types</option>
              <option value="multiple-choice">Multiple Choice Only</option>
              <option value="true-false">True / False Only</option>
              <option value="short-answer">Short Answer Only</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Interactive Quiz Area */}
      {questions.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {!quizStarted && !quizCompleted && (
            <div className="text-center py-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-100 dark:border-purple-900">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {quizTitle}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {questions.length} questions prepared based on your study material.
              </p>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={immediateFeedback}
                    onChange={(e) => setImmediateFeedback(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Show instant feedback &amp; explanations</span>
                </label>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuizStarted(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Quiz Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Question View */}
          {quizStarted && !quizCompleted && currentQ && (
            <div className="space-y-6">
              {/* Progress & Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Type: <span className="capitalize">{currentQ.type.replace('-', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{
                        width: `${((currentIndex + 1) / questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.question}
              </div>

              {/* Options */}
              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQ.id] === opt;
                    const isAnswered = !!selectedAnswers[currentQ.id];
                    const isCorrect = opt === currentQ.correctAnswer;

                    let btnClass = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';
                    if (isSelected) {
                      btnClass = 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold';
                    }
                    if (immediateFeedback && isAnswered) {
                      if (isCorrect) {
                        btnClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
                      } else if (isSelected) {
                        btnClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-semibold';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id, opt)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition-all cursor-pointer ${btnClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {immediateFeedback && isAnswered && (
                          <div>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Short answer input */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={selectedAnswers[currentQ.id] || ''}
                    onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  {immediateFeedback && selectedAnswers[currentQ.id] && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-purple-600">Model Answer: </span>
                      {currentQ.correctAnswer}
                    </div>
                  )}
                </div>
              )}

              {/* Immediate explanation popup */}
              {immediateFeedback && selectedAnswers[currentQ.id] && currentQ.explanation && (
                <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300">
                  <div className="font-bold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Explanation</span>
                  </div>
                  <p>{currentQ.explanation}</p>
                </div>
              )}

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <span>{currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quiz Completed Results View */}
          {quizCompleted && results && (
            <div className="space-y-6">
              <div className="text-center py-6 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-600/30">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Quiz Completed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {quizTitle}
                </p>

                <div className="mt-4 inline-flex items-baseline gap-2 px-6 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                  <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                    {results.scorePercentage}%
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    ({results.correctAnswers} of {results.totalQuestions} correct)
                  </span>
                </div>
              </div>

              {/* Answer breakdown list */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Detailed Review
                </h4>
                {results.answers.map((ans, idx) => (
                  <div
                    key={ans.questionId}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      ans.isCorrect
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {idx + 1}. {ans.questionText}
                      </span>
                      {ans.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="font-medium text-slate-500">Your Answer: </span>
                        <span className={ans.isCorrect ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {ans.userAnswer}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Correct Answer: </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{ans.correctAnswer}</span>
                      </div>
                    </div>

                    {ans.explanation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        {ans.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleRestartQuiz}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Save Result to My Study Materials</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && results && (
        <AIActionConfirmationModal
          isOpen={confirmModalOpen}
          action={{
            id: `act_${Date.now()}`,
            type: 'save_quiz_result',
            title: `Save Quiz: ${quizTitle}`,
            description: `Store this completed quiz result (${results.scorePercentage}%, ${results.totalQuestions} questions) under your account in My Study Materials.`,
            payload: {
              title: quizTitle,
              scorePercentage: results.scorePercentage,
              totalQuestions: results.totalQuestions,
              correctAnswers: results.correctAnswers,
            },
          }}
          onConfirm={handleConfirmSaveResult}
          onCancel={() => setConfirmModalOpen(false)}
          isExecuting={isSaving}
        />
      )}
    </div>
  );
};
