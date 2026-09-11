import { NextRequest } from 'next/server'
import {
  handleListSettingsVersions,
  handleRestoreSettingsVersion,
} from '@/lib/settingsVersionsApi'

export const dynamic = 'force-dynamic'

// GET /api/webinars/[id]/settings-versions - settings history, newest first
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return handleListSettingsVersions('internal', params.id)
}

// POST /api/webinars/[id]/settings-versions - restore a saved version
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handleRestoreSettingsVersion('internal', params.id, request)
}
