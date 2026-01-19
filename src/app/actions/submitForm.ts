'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'
import { tagClickFunnelsContact } from '@/lib/clickfunnels'

export async function submitForm(formId: string, formData: FormData) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: true }
  })

  if (!form) throw new Error('Form not found')

  const submissionData: Record<string, any> = {}

  // Parse fields
  form.fields.forEach(field => {
    let value: any
    
    // Check if it's a multi-value field (like checkbpxes with multiple options)
    // Simple heuristic: if formData.getAll returns > 1 item, store as array
    const allValues = formData.getAll(field.id)
    
    if (allValues.length > 1) {
      value = allValues
    } else {
      value = allValues[0] // could be undefined
    }

    // Basic validation
    if (field.required && !value) {
      // For required checkboxes, at least one must be checked
      throw new Error(`Field "${field.label}" is required`)
    }
    
    if (value) {
        submissionData[field.id] = value
    }
  })

  let aiStatus: 'APPROVED' | 'REJECTED' | 'REVIEW' | null = null
  let aiReason: string | null = null

  // AI Assessment
  if (form.aiAssessmentEnabled && process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      
      const prompt = `
        You are an AI Form Assessor.
        
        Specific Rules:
        ${form.aiPrompt || 'Assess the submission for quality and validity.'}
        
        Standard Rules:
        1. Check if the text is legible (not gibberish).
        2. If specific rules mention age, strictly enforce it.
        
        Form Fields:
        ${JSON.stringify(form.fields.map(f => ({ label: f.label, type: f.type })))}
        
        User Submission:
        ${JSON.stringify(submissionData)}
        
        Respond ONLY with a JSON object in this format:
        { "status": "APPROVED" | "REJECTED" | "REVIEW", "reason": "Short explanation for internal record" }
      `

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'gpt-4o', // or gpt-3.5-turbo if cost is concern, but gpt-4o is better for reasoning
        response_format: { type: 'json_object' }
      })

      const content = completion.choices[0].message.content
      if (content) {
        const result = JSON.parse(content)
        aiStatus = result.status
        aiReason = result.reason
      }
    } catch (error) {
      console.error('AI Assessment failed:', error)
      // Fallback: pending review or approve? Let's just default null (no AI decision)
    }
  }

  // ClickFunnels Integration: Tag RH26-APPROVED if approved
  if (aiStatus === 'APPROVED') {
    const emailField = form.fields.find(f => f.type === 'email')
    if (emailField) {
      const email = submissionData[emailField.id]
      if (email && typeof email === 'string') {
        // Run in background (fire and forget) to not slow down response
        tagClickFunnelsContact(email, ['RH26-APPROVED']).catch(err => 
          console.error('Failed to tag user in ClickFunnels:', err)
        )
      }
    }
  }

  // Save submission
  const existingId = formData.get('submissionId') as string | null

  if (existingId) {
    // Check if it exists and update
    const existing = await prisma.formSubmission.findUnique({
      where: { id: existingId }
    })

    if (existing) {
      await prisma.formSubmission.update({
        where: { id: existingId },
        data: {
          data: JSON.stringify(submissionData),
          aiStatus,
          aiReason,
          status: 'COMPLETED',
          lastSavedAt: new Date()
        }
      })
    } else {
        // Fallback create if not found
        await prisma.formSubmission.create({
            data: {
              formId,
              data: JSON.stringify(submissionData),
              userAgent: 'server-action', 
              aiStatus,
              aiReason,
              status: 'COMPLETED'
            }
        })
    }
  } else {
    await prisma.formSubmission.create({
        data: {
        formId,
        data: JSON.stringify(submissionData),
        userAgent: 'server-action', 
        aiStatus,
        aiReason,
        status: 'COMPLETED'
        }
    })
  }

  // Determine response message
  let responseData = {
    success: true,
    status: aiStatus || 'SUBMITTED',
    title: 'Success!', 
    message: form.successMsg,
    redirectUrl: form.redirectUrl
  }

  if (aiStatus === 'APPROVED') {
    responseData.title = form.aiApproveTitle || 'Application Approved'
    responseData.message = form.aiApproveMsg || form.successMsg
  } else if (aiStatus === 'REJECTED') {
    responseData.success = false // It's a "successful submission" technically, but from user UX it's a rejection.
    // Actually, usually we show success state but with rejection message.
    // Let's keep success=true so the form clears/hides, but show the rejection UI.
    responseData.title = form.aiRejectTitle || 'Application Rejected'
    responseData.message = form.aiRejectMsg || 'Sorry, your application was rejected.'
  } else if (aiStatus === 'REVIEW') {
    responseData.title = form.aiReviewTitle || 'Sent for Approval'
    responseData.message = form.aiReviewMsg || 'Your application is under review.'
  }

  return responseData
}
