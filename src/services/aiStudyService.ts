import { localDb } from '../lib/localDb.ts';
import {
  AIStudyMaterial,
  AISession,
  AISessionMessage,
  QuizQuestion,
  FlashcardCard,
  StudyTask,
  StudySession,
  AIProposedAction,
} from '../types/index.ts';
import { saveStudyTask, saveStudySession } from './studyService.ts';

export type Unsubscribe = () => void;

// ============================================================
// 1. HTTP / STREAMING CLIENT HELPERS
// ============================================================

export interface AIHealthStatus {
  status: string;
  configured: boolean;
  model?: string;
  error?: string;
}

export interface AIChatResponse {
  reply: string;
  groundedInContext: boolean;
  contextUsed?: {
    title?: string;
    sizeChars: number;
  };
  suggestedFollowUps?: string[];
}

export interface QuizGenerateResponse {
  quizTitle: string;
  topic?: string;
  difficulty?: string;
  questions: QuizQuestion[];
}

export interface FlashcardsGenerateResponse {
  deckTitle: string;
  topic?: string;
  cards: FlashcardCard[];
}

export interface StudyPlanSuggestionItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  timeSlot?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  subject?: string;
  actionable?: boolean;
}

export interface StudyPlanGenerateResponse {
  planTitle: string;
  overview: string;
  weeklyHoursRecommended: number;
  dailyBreakdown: Array<{
    day: string;
    focus: string;
    tasks: string[];
    suggestedMinutes: number;
  }>;
  actionableTasks: StudyPlanSuggestionItem[];
  tips: string[];
}

export interface AssignmentBreakdownResponse {
  assignmentTitle: string;
  summary: string;
  checklist: Array<{
    id: string;
    stepNumber: number;
    title: string;
    description: string;
    estimatedMinutes?: number;
  }>;
  workSequence: string[];
  suggestedMilestones: Array<{
    title: string;
    targetDaysBeforeDue: number;
    deliverable: string;
  }>;
  outline: string;
  effortEstimate: {
    totalHours: number;
    difficultyRating: string;
    pacingAdvice: string;
  };
}

export interface NotesIntelligenceResponse {
  noteTitle: string;
  summary: string;
  keyPoints: string[];
  revisionQuestions: Array<{
    question: string;
    answerHint: string;
  }>;
  flashcardSuggestions: Array<{
    front: string;
    back: string;
  }>;
  organizedOutline: string;
  repeatedConcepts: string[];
}

export interface CitationResponse {
  formattedCitation: string;
  inTextCitation: string;
  style: 'apa' | 'mla' | 'chicago';
  missingFields: string[];
  providedFieldsUsed: string[];
  notes?: string;
}

/**
 * Health check: verify whether server-side Gemini is configured and accessible
 */
export async function checkAIHealth(): Promise<AIHealthStatus> {
  try {
    const res = await fetch('/api/ai/health');
    if (!res.ok) {
      return { status: 'error', configured: false, error: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: 'offline',
      configured: false,
      error: err?.message || 'Server connection failed',
    };
  }
}

/**
 * Conversational Ask AI endpoint
 */
export async function sendAIChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: { title?: string; type?: string; content?: string },
  abortSignal?: AbortSignal
): Promise<AIChatResponse> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `AI request failed with HTTP ${response.status}`);
  }
  return data;
}

/**
 * Streaming Ask AI endpoint via Server-Sent Events
 */
export async function streamAIChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: { title?: string; type?: string; content?: string },
  onChunk?: (chunk: string) => void,
  onDone?: () => void,
  onError?: (err: Error) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/api/ai/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Streaming request failed (HTTP ${response.status})`);
    }

    if (!response.body) {
      throw new Error('Streaming response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            onDone?.();
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              onChunk?.(parsed.text);
            }
          } catch {
            // Raw text chunk fallback
            onChunk?.(payload);
          }
        }
      }
    }
    onDone?.();
  } catch (err: any) {
    if (abortSignal?.aborted) return;
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Document tools: summarize, explain, rewrite, key-points
 */
export async function runDocumentAI(
  mode: 'summarize' | 'explain' | 'rewrite' | 'analyze' | 'key-points',
  text: string,
  options?: {
    summaryLength?: 'short' | 'detailed' | 'key-takeaways';
    explanationLevel?: 'simple' | 'step-by-step' | 'beginner' | 'example';
    rewriteStyle?: 'clearer' | 'concise' | 'grammar' | 'academic' | 'simplify' | 'bullets';
  },
  abortSignal?: AbortSignal
): Promise<{ title: string; output: string; keyTakeaways?: string[] }> {
  const response = await fetch('/api/ai/document-tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, text, options }),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Document AI failed (HTTP ${response.status})`);
  }
  return data;
}

/**
 * Generate interactive Quiz from study material
 */
export async function generateQuiz(
  contextText: string,
  topicTitle?: string,
  config?: {
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionType?: 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed';
  },
  abortSignal?: AbortSignal
): Promise<QuizGenerateResponse> {
  const response = await fetch('/api/ai/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contextText, topicTitle, ...config }),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Quiz generation failed (HTTP ${response.status})`);
  }
  return data;
}

/**
 * Generate Flashcards from study material
 */
export async function generateFlashcards(
  contextText: string,
  topicTitle?: string,
  count?: number,
  abortSignal?: AbortSignal
): Promise<FlashcardsGenerateResponse> {
  const response = await fetch('/api/ai/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contextText, topicTitle, count }),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Flashcard generation failed (HTTP ${response.status})`);
  }
  return data;
}

/**
 * Generate Study Plan from user's real academic information
 */
export async function generateStudyPlan(
  studyData: {
    availableHoursPerDay?: number;
    targetDate?: string;
    subjects?: Array<{ name: string; color?: string }>;
    tasks?: Array<{ title: string; priority?: string; dueDate?: string }>;
    assignments?: Array<{ title: string; dueDate?: string }>;
    exams?: Array<{ title: string; examDate?: string }>;
    habits?: Array<{ name: string }>;
    customFocus?: string;
  },
  abortSignal?: AbortSignal
): Promise<StudyPlanGenerateResponse> {
  const response = await fetch('/api/ai/study-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studyData),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Study plan generation failed (HTTP ${response.status})`);
  }
  return data;
}

/**
 * Assignment Assistant: breakdown, checklist, effort estimates, sequence
 */
export async function runAssignmentAssistant(
  assignment: {
    title: string;
    subject?: string;
    dueDate?: string;
    notes?: string;
    userAvailableHours?: number;
  },
  actionType: 'breakdown' | 'checklist' | 'work-sequence' | 'effort-estimate' | 'milestones' | 'outline',
  abortSignal?: AbortSignal
): Promise<AssignmentBreakdownResponse> {
  const response = await fetch('/api/ai/assignment-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignment, actionType }),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Assignment assistant failed (HTTP ${response.status})`);
  }
  return data;
}

/**
 * Notes Intelligence Assistant
 */
export async function runNotesAssistant(
  note: { title: string; content: string },
  actionType:
    | 'summarize'
    | 'key-points'
    | 'revision-questions'
    | 'flashcards'
    | 'organize-headings'
    | 'repeated-concepts'
    | 'study-outline',
  abortSignal?: AbortSignal
): Promise<NotesIntelligenceResponse> {
  const response = await fetch('/api/ai/notes-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, actionType }),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Notes assistant failed (HTTP ${response.status})`);
  }
  return data;
}

/**
 * Citation & Reference Helper
 */
export async function formatCitationHelper(
  style: 'apa' | 'mla' | 'chicago',
  metadata: {
    sourceTitle: string;
    author?: string;
    year?: string;
    publisher?: string;
    url?: string;
    accessDate?: string;
    pages?: string;
    journalName?: string;
    volume?: string;
    issue?: string;
    doi?: string;
  },
  abortSignal?: AbortSignal
): Promise<CitationResponse> {
  const response = await fetch('/api/ai/citation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style, metadata }),
    signal: abortSignal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Citation formatter failed (HTTP ${response.status})`);
  }
  return data;
}

// ============================================================
// 2. LOCAL PERSISTENCE: AI STUDY MATERIALS & SESSIONS
// ============================================================

/**
 * Save an AI study material (Flashcards, Quiz, Summary, Study Plan, etc.)
 */
export async function saveUserAIMaterial(
  uid: string,
  material: AIStudyMaterial
): Promise<void> {
  localDb.saveItem('ai_study_materials', uid, {
    ...material,
    userId: uid,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete an AI study material
 */
export async function deleteUserAIMaterial(
  uid: string,
  materialId: string
): Promise<void> {
  localDb.deleteItem('ai_study_materials', uid, materialId);
}

/**
 * Toggle starred status of AI study material
 */
export async function toggleStarAIMaterial(
  uid: string,
  materialId: string,
  isStarred: boolean
): Promise<void> {
  const existing = localDb.getItem<AIStudyMaterial>('ai_study_materials', uid, materialId);
  if (existing) {
    localDb.saveItem('ai_study_materials', uid, {
      ...existing,
      isStarred,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Rename an AI study material
 */
export async function renameUserAIMaterial(
  uid: string,
  materialId: string,
  newTitle: string
): Promise<void> {
  const existing = localDb.getItem<AIStudyMaterial>('ai_study_materials', uid, materialId);
  if (existing) {
    localDb.saveItem('ai_study_materials', uid, {
      ...existing,
      title: newTitle.trim(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Real-time subscription to user's saved AI study materials
 */
export function subscribeUserAIMaterials(
  uid: string,
  onUpdate: (materials: AIStudyMaterial[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<AIStudyMaterial>('ai_study_materials', uid, onUpdate, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
  });
}

/**
 * Save or update an AI conversation session
 */
export async function saveUserAISession(
  uid: string,
  session: AISession
): Promise<void> {
  localDb.saveItem('ai_sessions', uid, {
    ...session,
    userId: uid,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete an AI conversation session
 */
export async function deleteUserAISession(
  uid: string,
  sessionId: string
): Promise<void> {
  localDb.deleteItem('ai_sessions', uid, sessionId);
}

/**
 * Subscribe to recent AI conversation sessions
 */
export function subscribeUserAISessions(
  uid: string,
  onUpdate: (sessions: AISession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<AISession>('ai_sessions', uid, onUpdate, {
    orderByField: 'updatedAt',
    orderDirection: 'desc',
  });
}

// ============================================================
// 3. AI ACTION CONFIRMATION EXECUTOR
// ============================================================

/**
 * Safely execute an approved AI Action into StudentHub real records
 */
export async function executeAIProposedAction(
  uid: string,
  action: AIProposedAction
): Promise<{ success: boolean; message: string }> {
  switch (action.type) {
    case 'create_task': {
      const p = action.payload;
      const newTask: StudyTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: p.title || 'New AI Suggested Task',
        priority: p.priority || 'medium',
        status: 'todo',
        category: p.category || 'assignment',
        dueDate: p.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        estimatedDuration: p.estimatedMinutes || 45,
        subjectId: p.subjectId,
        subjectName: p.subjectName,
        notes: p.notes || `Created via AI Study Assistant from ${action.title}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveStudyTask(uid, newTask);
      return { success: true, message: `Task "${newTask.title}" added to Study Planner.` };
    }

    case 'create_study_session': {
      const p = action.payload;
      const newSession: StudySession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        subjectId: p.subjectId || '',
        subjectName: p.subjectName || 'Study Session',
        topic: p.topic || p.title || 'AI Guided Session',
        duration: (p.durationMinutes || 45) * 60,
        durationMinutes: p.durationMinutes || 45,
        actualStart: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
        plannedStart: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
        status: 'planned',
        notes: p.notes || 'Scheduled via AI Study Plan Generator',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveStudySession(uid, newSession);
      return { success: true, message: `Study session "${newSession.topic}" recorded.` };
    }

    case 'save_flashcards': {
      const p = action.payload;
      const material: AIStudyMaterial = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: uid,
        title: p.title || 'Flashcard Deck',
        category: 'flashcards',
        sourceContext: p.sourceContext,
        content: `${p.cards?.length || 0} Flashcards generated by AI Study Assistant`,
        data: p.cards || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUserAIMaterial(uid, material);
      return { success: true, message: `Flashcards saved to My Study Materials.` };
    }

    case 'save_quiz_result': {
      const p = action.payload;
      const material: AIStudyMaterial = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: uid,
        title: `${p.quizTitle || 'Quiz'} Result (${p.scorePercentage || 0}%)`,
        category: 'quiz',
        sourceContext: p.sourceContext,
        content: `Score: ${p.correctAnswers}/${p.totalQuestions} (${p.scorePercentage}%)`,
        data: p,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUserAIMaterial(uid, material);
      return { success: true, message: `Quiz result saved to My Study Materials.` };
    }

    default:
      throw new Error(`Unsupported AI action type: ${action.type}`);
  }
}

// ============================================================
// COMPATIBILITY & CONVENIENCE EXPORTS
// ============================================================

export interface DocumentAIActionResponse {
  title: string;
  content: string;
}

export const checkAIServiceHealth = checkAIHealth;
export const toggleStarUserAIMaterial = toggleStarAIMaterial;

export async function askAIStudyQuestion(params: {
  question: string;
  context?: { title?: string; type?: string; content?: string };
}): Promise<{ answer: string; groundedInContext?: boolean }> {
  const res = await sendAIChat(
    [{ role: 'user', content: params.question }],
    params.context
  );
  return { answer: res.reply, groundedInContext: res.groundedInContext };
}

export async function runDocumentAIAction(
  mode: 'summarize' | 'explain' | 'rewrite' | 'analyze' | 'key-points',
  text: string,
  title?: string,
  subOption?: string
): Promise<{ title: string; content: string }> {
  const options: any = {};
  if (mode === 'summarize') options.summaryLength = subOption || 'short';
  if (mode === 'explain') options.explanationLevel = subOption || 'simple';
  if (mode === 'rewrite') options.rewriteStyle = subOption || 'clearer';
  const res = await runDocumentAI(mode, text, options);
  return { title: res.title, content: res.output };
}

export async function generateAIQuiz(params: {
  context: { title?: string; content?: string; type?: string };
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionType?: 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed';
}): Promise<{ questions: QuizQuestion[]; quizTitle: string }> {
  return await generateQuiz(
    params.context.content || '',
    params.context.title,
    {
      count: params.questionCount,
      difficulty: params.difficulty,
      questionType: params.questionType,
    }
  );
}

export async function generateAIFlashcards(params: {
  context: { title?: string; content?: string; type?: string };
  cardCount?: number;
  focusArea?: string;
}): Promise<{ cards: FlashcardCard[]; deckTitle: string }> {
  return await generateFlashcards(
    params.context.content || '',
    params.context.title,
    params.cardCount
  );
}

export async function getUserAIMaterials(uid: string): Promise<AIStudyMaterial[]> {
  return new Promise((resolve) => {
    const unsub = subscribeUserAIMaterials(
      uid,
      (mats) => {
        unsub();
        resolve(mats);
      },
      () => {
        unsub();
        resolve([]);
      }
    );
  });
}

