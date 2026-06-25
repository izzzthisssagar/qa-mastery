import { notFound } from "next/navigation";
import { Badge } from "@qa-mastery/ui";
import { getProject } from "../../actions";
import { labelFor } from "@/lib/talent/taxonomy";
import { ApplyButton } from "../../_components/apply-button";
import { ApplicantsList, type Applicant } from "../../_components/applicants-list";

type Params = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Params) {
  const { id } = await params;
  const res = await getProject(id);
  if (!res.ok) notFound();
  const { project, applications, isOwner, myApplication } = res.data;

  const requiredTypes = (project.required_types as string[] | null) ?? [];
  const stack = (project.stack as string[] | null) ?? [];

  return (
    <div className="space-y-8 py-2">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight">{project.title as string}</h1>
          <Badge tone="default">{labelFor(project.project_type as string)}</Badge>
          <Badge tone="default">{labelFor(project.engagement as string)}</Badge>
          {Boolean(project.nda_required) && <Badge tone="info">NDA</Badge>}
        </div>
        {(project.description as string) && (
          <p className="max-w-2xl whitespace-pre-wrap text-zinc-300">{project.description as string}</p>
        )}
      </header>

      {requiredTypes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400">Required testing types</h2>
          <div className="flex flex-wrap gap-2">
            {requiredTypes.map((t) => (
              <Badge key={t} tone="info">
                {labelFor(t)}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {stack.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400">Tech stack</h2>
          <div className="flex flex-wrap gap-2 font-mono text-xs text-zinc-300">
            {stack.map((s) => (
              <span key={s} className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1">
                {labelFor(s)}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {isOwner ? (
          <>
            <h2 className="text-sm font-medium text-zinc-300">Applicants</h2>
            <ApplicantsList applicants={applications as unknown as Applicant[]} />
          </>
        ) : (
          <>
            <h2 className="text-sm font-medium text-zinc-300">Interested?</h2>
            <ApplyButton projectId={id} applied={myApplication != null} />
          </>
        )}
      </section>
    </div>
  );
}
