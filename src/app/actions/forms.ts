'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { tagClickFunnelsContact } from '@/lib/clickfunnels'

export async function createForm(formData: FormData) {
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string

  if (!title || !slug) {
    throw new Error('Title and Slug are required')
  }

  // Check if slug exists
  const existing = await prisma.form.findUnique({
    where: { slug }
  })

  if (existing) {
    throw new Error('Slug already exists')
  }

  const form = await prisma.form.create({
    data: {
      title,
      slug,
      description
    }
  })

  revalidatePath('/dashboard/forms')
  redirect(`/dashboard/forms/${form.id}`)
}

export async function addField(formId: string, type: string) {
  const maxOrder = await prisma.formField.findFirst({
    where: { formId },
    orderBy: { position: 'desc' },
    select: { position: true }
  })
  
  const newPosition = (maxOrder?.position ?? -1) + 1

  await prisma.formField.create({
    data: {
      formId,
      type,
      label: 'New Question',
      position: newPosition
    }
  })
  
  revalidatePath(`/dashboard/forms/${formId}`)
}

export async function updateField(fieldId: string, data: any) {
  await prisma.formField.update({
    where: { id: fieldId },
    data
  })
  revalidatePath('/dashboard/forms') // Revalidate broadly to be safe
}

export async function deleteField(fieldId: string, formId: string) {
  await prisma.formField.delete({
    where: { id: fieldId }
  })
  revalidatePath(`/dashboard/forms/${formId}`)
}

export async function updateFormSettings(formId: string, data: any) {
  await prisma.form.update({
    where: { id: formId },
    data: {
        ...data,
        redirectUrl: data.redirectUrl || null // Ensure empty string becomes null if passed
    }
  })
  revalidatePath(`/dashboard/forms/${formId}`)
}

export async function reorderField(formId: string, fieldId: string, direction: 'up' | 'down') {
  const field = await prisma.formField.findUnique({
    where: { id: fieldId }
  })

  if (!field) return

  const currentPosition = field.position
  const targetPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1

  // Find the field at the target position
  const otherField = await prisma.formField.findFirst({
    where: {
      formId,
      position: targetPosition
    }
  })
  
  if (otherField) {
    // Swap positions
    await prisma.$transaction([
      prisma.formField.update({
        where: { id: fieldId },
        data: { position: targetPosition }
      }),
      prisma.formField.update({
        where: { id: otherField.id },
        data: { position: currentPosition }
      })
    ])
  }
  
  revalidatePath(`/dashboard/forms/${formId}`)
}

export async function deleteSubmission(submissionId: string, formId: string) {
  await prisma.formSubmission.delete({
    where: { id: submissionId }
  })
  revalidatePath(`/dashboard/forms/${formId}`)
}

export async function updateSubmissionStatus(submissionId: string, status: string, formId: string) {
  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: { aiStatus: status }
  })

  // Start ClickFunnels tagging if approved (manual override)
  if (status === 'APPROVED') {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true }
    })

    if (form) {
      // Find email field by type OR by label containing "email" (case-insensitive)
      const emailField = form.fields.find(f => 
        f.type === 'email' || 
        f.label?.toLowerCase().includes('email')
      )
      if (emailField) {
        try {
            const data = JSON.parse(submission.data as string)
            const email = data[emailField.id]
            if (email) {
                console.log('🏷️ Form approval - tagging contact:', email, 'with RH26-APPROVED')
                // Fire and forget, but log error
                tagClickFunnelsContact(email, ['RH26-APPROVED']).catch(e => 
                    console.error('Manual approval tagging failed:', e)
                )
            } else {
                console.log('⚠️ Form approval - no email value found in field:', emailField.id)
            }
        } catch (e) {
            console.error('Error parsing submission data for tagging:', e)
        }
      } else {
        console.log('⚠️ Form approval - no email field found in form:', formId)
      }
    }
  }

  revalidatePath(`/dashboard/forms/${formId}`);
}
