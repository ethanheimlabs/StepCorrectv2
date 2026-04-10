import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { NewInventoryForm } from "@/components/inventory/new-inventory-form";

export default function NewInventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Inventory"
        description="Dump it here. Keep it honest."
      />
      <SectionCard title="Start with the raw thought" description="We’ll sort the rest after that.">
        <NewInventoryForm />
      </SectionCard>
    </div>
  );
}
