import { PageSkeleton } from "@/components/ui/PageSkeleton"

export default function Loading() {
  return <PageSkeleton hasButton hasFilter rows={10} cols={5} />
}
