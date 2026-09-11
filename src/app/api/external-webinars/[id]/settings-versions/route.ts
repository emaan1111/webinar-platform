import { NextRequest } from 'next/server'
import {
  handleListSettingsVersions,
  handleRestoreSettingsVersion,
} from '@/lib/settingsVersionsApi'

export const dynamic = 'force-dynamic'

// GET /api/external-webinars/[id]/settings-versions - settings history, newest first
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return handleListSettingsVersions('external', params.id)
}

// POST /api/external-webinars/[id]/settings-versions - restore a saved version
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handleRestoreSettingsVersion('external', params.id, request)
}
