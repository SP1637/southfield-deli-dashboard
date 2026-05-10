import { redirect } from "next/navigation";

/**
 * /settings → redirect to the first settings sub-page.
 * Add more sub-pages here as they're built.
 */
export default function SettingsIndexPage() {
  redirect("/settings/team");
}
