import { NextRequest, NextResponse } from 'next/server'
import { getClickFunnelsContactTags, tagClickFunnelsContact } from '@/lib/clickfunnels'

/**
 * POST /api/clickfunnels/check-contact-tags
 * 
 * Check what tags a contact has in ClickFunnels
 * Protected by CRON_SECRET
 * 
 * Body: { email: string, applyTag?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, applyTag } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log(`🔍 Checking ClickFunnels tags for: ${email}`)
    
    // Get current tags
    const result = await getClickFunnelsContactTags(email)
    
    // Optionally apply a tag
    let applyResult = null
    if (applyTag) {
      console.log(`🏷️ Applying tag "${applyTag}" to ${email}`)
      const success = await tagClickFunnelsContact(email, [applyTag])
      applyResult = { 
        tag: applyTag, 
        success,
        message: success ? 'Tag applied successfully' : 'Failed to apply tag'
      }
    }
    
    return NextResponse.json({
      email,
      contactFound: result.success,
      contactId: result.contactId,
      tagsCount: result.tags?.length || 0,
      tags: result.tags?.map((t: any) => t.tag?.name || t.name || 'Unknown') || [],
      applyResult,
      rawError: result.error
    })

  } catch (error) {
    console.error('Error checking contact tags:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}
