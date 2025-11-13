import { promises as fs } from 'fs'
import path from 'path'

const BRANDING_FILE = path.join(process.cwd(), 'data', 'branding.json')

export interface CountdownBrandingSettings {
  organizationName?: string
  contactEmail?: string
  websiteUrl?: string
  primaryColor?: string
  accentColor?: string
  logoUrl?: string
}

export async function readBrandingSettings(): Promise<CountdownBrandingSettings> {
  try {
    const raw = await fs.readFile(BRANDING_FILE, 'utf-8')
    return JSON.parse(raw) as CountdownBrandingSettings
  } catch (error) {
    console.error('Error reading branding settings:', error)
    return {}
  }
}

export async function writeBrandingSettings(
  data: CountdownBrandingSettings
): Promise<void> {
  try {
    await fs.mkdir(path.dirname(BRANDING_FILE), { recursive: true })
    await fs.writeFile(BRANDING_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing branding settings:', error)
    throw error
  }
}
