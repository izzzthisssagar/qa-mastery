/** Contract every lesson widget receives from the lesson page. */
export interface WidgetProps {
  lessonSlug: string;
  /** Called when the learner hits a progress-worthy interaction milestone. */
  onMilestone?: (milestone: string) => void;
}
