import { NextResponse } from 'next/server'
import { readBrandingSettings, writeBrandingSettings } from '@/lib/brandingSettings'

export async function GET() {
  try {
    const settings = await readBrandingSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to load branding settings:', error)
    return NextResponse.json(
      { error: 'Unable to load branding settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json()
    const current = await readBrandingSettings()
    const merged = { ...current, ...updates }
    await writeBrandingSettings(merged)
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Failed to update branding settings:', error)
    return NextResponse.json(
      { error: 'Unable to update branding settings' },
      { status: 500 }
    )
  }
}
