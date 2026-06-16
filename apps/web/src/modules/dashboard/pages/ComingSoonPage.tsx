import { ComingSoon } from '../components/ComingSoon'

type ComingSoonPageProps = {
  title: string
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return <ComingSoon title={title} />
}
