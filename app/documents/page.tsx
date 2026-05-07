import { redirect } from "next/navigation"

// /documents was a duplicate of /legal — keep the URL alive but route to the
// single index now living at /legal so we don't fork the experience.
export default function DocumentsPage() {
  redirect("/legal")
}
