import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { findLessonBySlug, loadLessonBody, loadQuiz, MODULES } from "@qa-mastery/curriculum";
import { LessonProgressProvider } from "./progress-context";
import {
  SeeWidget,
  StateMachineWidget,
  DecisionTableWidget,
  TriageGridWidget,
  PartitionPickerWidget,
} from "./see-widget";
import { LessonLab, LessonHunt, LessonCapstone } from "./lab-widget";
import { mdxComponents } from "./mdx-components";
import { QuizPanel, type PublicQuizQuestion } from "./quiz-panel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = findLessonBySlug(slug);
  return { title: lesson?.frontmatter.title ?? "Lesson not found" };
}

export default async function LessonPage({ params }: PageProps) {
  const { slug } = await params;
  const lesson = findLessonBySlug(slug);
  if (!lesson || lesson.frontmatter.status !== "published") notFound();

  const fm = lesson.frontmatter;
  const moduleMeta = MODULES[fm.module];
  const body = loadLessonBody(slug);

  // Strip the answer key — `correct`/`explanation` are server-only and reach
  // the client only after grading, via submitQuiz's return value.
  const quiz = loadQuiz(slug);
  const publicQuestions: PublicQuizQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
  }));

  return (
    <LessonProgressProvider slug={slug}>
      <article className="mx-auto max-w-3xl pb-16">
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {moduleMeta ? `${fm.module} · ${moduleMeta.title}` : fm.module}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{fm.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            ~{fm.duration_min} min · See it · Try it · Do it · Prove it
          </p>
        </header>

        <div className="text-zinc-300">
          <MDXRemote
            source={body}
            components={{
              ...mdxComponents,
              BoundarySlider: SeeWidget,
              StateMachine: StateMachineWidget,
              DecisionTable: DecisionTableWidget,
              TriageGrid: TriageGridWidget,
              PartitionPicker: PartitionPickerWidget,
              BugReportLab: LessonLab,
              BugHunt: LessonHunt,
              CapstoneSubmission: LessonCapstone,
            }}
          />
        </div>

        <QuizPanel slug={slug} questions={publicQuestions} />
      </article>
    </LessonProgressProvider>
  );
}
