export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-6">
      <p className="text-purpleLight text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="border border-gold/60 text-gold hover:bg-gold hover:text-ink transition-colors font-body text-xs tracking-[0.2em] uppercase px-6 py-3"
      >
        Retry
      </button>
    </div>
  );
}
