import { Construction } from 'lucide-react'

type ComingSoonProps = {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="glass-surface rim-light squircle max-w-lg p-12 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed/50">
          <Construction className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-headline text-headline-lg text-on-surface">{title}</h2>
        <p className="mt-3 font-body text-body-md text-outline">
          {description ?? 'This section is under development and will be available soon.'}
        </p>
        <span className="mt-6 inline-flex items-center rounded-full border border-primary/20 bg-primary-fixed/30 px-4 py-1.5 text-label-sm font-bold uppercase tracking-wider text-primary">
          Coming Soon
        </span>
      </div>
    </div>
  )
}
