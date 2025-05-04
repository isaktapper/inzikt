"use client"

import { ReactNode } from "react"
import DashboardLayout from '../dashboard/layout'

export default function JobsLayout({
  children,
}: {
  children: ReactNode
}) {
  // We'll reuse the dashboard layout
  return <DashboardLayout>{children}</DashboardLayout>
} 