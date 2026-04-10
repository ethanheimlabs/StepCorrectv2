import { redirect } from "next/navigation";

export default async function ReviewInventoryPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/app/inventory/${params.id}/review`);
}
