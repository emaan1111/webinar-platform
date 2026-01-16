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
    const { name, slug, isActive } = body;

    const splitTest = await prisma.splitTest.update({
      where: { id },
      data: {
        name,
        slug,
        isActive
      }
    });

    return NextResponse.json(splitTest);
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
