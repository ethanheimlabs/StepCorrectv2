import { redirect } from "next/navigation";

export default async function InventoryDetailPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/app/inventory/${params.id}`);
}
