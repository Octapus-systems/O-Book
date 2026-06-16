export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="glass-surface rim-light squircle p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-[#6D4AFF]" />
        <p className="mt-4 font-body text-body-md text-outline">Loading transaction details...</p>
      </div>
    </div>
  )
}
