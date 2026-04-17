import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = params;
    const body = await req.json();
    const { name, slug, isActive, variants } = body;

    const result = await prisma.$transaction(async (tx) => {
        // 1. Update main split test details
        const splitTest = await tx.splitTest.update({
            where: { id },
            data: {
                name,
                slug,
                isActive,
                updatedAt: new Date()
            }
        });

        // 2. Handle variants if provided
        if (variants && Array.isArray(variants)) {
            // Get existing variants
            const existingVariants = await tx.splitTestVariant.findMany({
                where: { splitTestId: id }
            });
            const existingVariantIds = existingVariants.map(v => v.id);
            const incomingVariantIds = variants.map((v: any) => v.id).filter(Boolean);

            // Delete removed variants
            const toDelete = existingVariantIds.filter(vid => !incomingVariantIds.includes(vid));
            if (toDelete.length > 0) {
                 await tx.splitTestVariant.deleteMany({
                    where: { id: { in: toDelete } }
                 });
            }

            // Update or Create variants
            for (const v of variants) {
                if (v.id && existingVariantIds.includes(v.id)) {
                    await tx.splitTestVariant.update({
                        where: { id: v.id },
                        data: {
                            leadPageId: v.leadPageId,
                            weight: Number(v.weight)
                        }
                    });
                } else {
                    await tx.splitTestVariant.create({
                        data: {
                            splitTestId: id,
                            leadPageId: v.leadPageId,
                            weight: Number(v.weight)
                        }
                    });
                }
            }
        }
        
        return splitTest;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update split test:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        return NextResponse.json({ error: 'A split test with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update split test' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = params;

    await prisma.splitTest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete split test:', error);
    return NextResponse.json({ error: 'Failed to delete split test' }, { status: 500 });
  }
}
