import type { Metadata } from "next";
import { ResetForm } from "../reset-forms";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return <ResetForm />;
}
