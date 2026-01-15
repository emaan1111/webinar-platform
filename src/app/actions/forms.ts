'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  } else {
      // If we are moving and there is no exact match (gap in sequence?), we might need a safer reorder
      // But for now, simple swap is fine as long as sequence is maintained. 
      // If no other field, generally means we are at edge or sparse array.
      // Let's at least try to find the "next" field if sparse.
      
      const adjacentField = await prisma.formField.findFirst({
          where: {
              formId,
              position: direction === 'up' ? { lt: currentPosition } : { gt: currentPosition }
          },
          orderBy: {
              position: direction === 'up' ? 'desc' : 'asc'
          }
      })
      
      if (adjacentField) {
           await prisma.$transaction([
            prisma.formField.update({
                where: { id: fieldId },
                data: { position: adjacentField.position }
            }),
            prisma.formField.update({
                where: { id: adjacentField.id },
                data: { position: currentPosition }
            })
            ])
      }
  }

  revalidatePath(`/dashboard/forms/${formId}`)
}
