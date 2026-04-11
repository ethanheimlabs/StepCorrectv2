export function AIFallbackNotice() {
  return (
    <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-950">
      <p className="font-semibold">Local fallback mode</p>
      <p className="mt-1 text-amber-900/90">
        Real OpenAI calls are off right now. StepCorrect is using local fallback logic until
        <code className="mx-1 rounded bg-white/80 px-1.5 py-0.5 text-[12px]">OPENAI_API_KEY</code>
        is set.
      </p>
    </div>
  );
}
