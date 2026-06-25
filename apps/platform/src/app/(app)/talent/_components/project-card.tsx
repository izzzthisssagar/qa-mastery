import Link from "next/link";
import { Badge } from "@qa-mastery/ui";
import { labelFor } from "@/lib/talent/taxonomy";
import type { ProjectCardData } from "@/app/(app)/talent/actions";

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link
      href={`/talent/projects/${project.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-100">{project.title}</h3>
        {project.nda_required && <Badge tone="info">NDA</Badge>}
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        <Badge tone="default">{labelFor(project.project_type)}</Badge>
        <Badge tone="default">{labelFor(project.engagement)}</Badge>
      </div>
      {project.required_types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.required_types.slice(0, 5).map((t) => (
            <Badge key={t} tone="info">
              {labelFor(t)}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
