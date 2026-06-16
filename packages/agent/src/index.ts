export {
  computeBrainStage,
  brainStageLabel,
  isNewActiveDay,
  updateTopicMasteryOnQuiz,
  pruneMemoriesByCap,
  type BrainStage,
  type TopicLevel,
  type TopicMasteryEntry,
  type TopicMasteryMap,
} from "./brain";

export { guardResponse, wouldGuard, guardFallback } from "./guard";

export { guardedStream } from "./streaming-guard";

export {
  chat,
  streamChat,
  resolveProvider,
  availableProviders,
  readLlmEnv,
} from "./llm/adapter";

export { EMBED_DIM, embedTexts, embedQuery } from "./embed";

export { classifyInScope, SCOPE_REFUSAL } from "./scope";

export type { ChatMessage, ChatRole, LlmEnv, ProviderName, ResolvedProvider } from "./llm/types";
