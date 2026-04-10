import { redirect } from "next/navigation";

export default async function InventoryActionsPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/app/inventory/${params.id}/actions`);
}
