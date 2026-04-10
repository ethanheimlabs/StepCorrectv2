import { redirect } from "next/navigation";

export default async function ClarifyInventoryPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/app/inventory/${params.id}/clarify`);
}
