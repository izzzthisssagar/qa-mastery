export {
  lessonFrontmatterSchema,
  type LessonFrontmatter,
} from "./frontmatter";

export {
  findContentRoot,
  listLessonFiles,
  loadAllLessons,
  parseLessonFile,
  findLessonBySlug,
  loadLessonBody,
  loadQuiz,
  type LessonSource,
  type QuizFile,
  type QuizQuestionFile,
} from "./load";

export {
  TRACKS,
  MODULES,
  moduleSlug,
  type TrackMeta,
  type ModuleMeta,
} from "./taxonomy";

export {
  NOTES_TAXONOMY,
  allNoteLeaves,
  findNoteModule,
  findNoteLeaf,
  type NoteModule,
  type NoteChapter,
  type NoteTopic,
  type NoteLeaf,
} from "./notes/taxonomy";

export {
  noteFrontmatterSchema,
  noteFilePath,
  listNoteFiles,
  getNote,
  type NoteFrontmatter,
  type NoteSource,
} from "./notes/load";

export {
  NOTE_TRACKS,
  trackForModule,
  findNoteTrack,
  type NoteTrack,
} from "./notes/tracks";
