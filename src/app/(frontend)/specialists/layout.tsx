import type { ReactNode } from 'react'
import { DirectoryLayout } from '@/Directory/Layout'
export default function Layout({ children }: { children: ReactNode }) {
  return <DirectoryLayout kind="specialists">{children}</DirectoryLayout>
}
