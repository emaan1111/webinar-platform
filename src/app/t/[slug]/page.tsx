import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function SplitTestPage({ params }: PageProps) {
  const { slug } = params;

  const splitTest = await prisma.splitTest.findUnique({
    where: { slug },
    include: {
      variants: {
        include: {
          leadPage: true
        }
      }
    }
  });

  if (!splitTest || !splitTest.isActive || splitTest.variants.length === 0) {
    notFound();
  }

  // Weighted random selection
  const totalWeight = splitTest.variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  
  let selectedVariant = splitTest.variants[0];
  for (const variant of splitTest.variants) {
    random -= variant.weight;
    if (random <= 0) {
      selectedVariant = variant;
      break;
    }
  }

  // Increment views
  // Fire and forget to avoid blocking
  const trackView = async () => {
      try {
        await prisma.$transaction([
            prisma.splitTest.update({
                where: { id: splitTest.id },
                data: { views: { increment: 1 } }
            }),
            prisma.splitTestVariant.update({
                where: { id: selectedVariant.id },
                data: { views: { increment: 1 } }
            }),
            prisma.splitTestEvent.create({
              data: {
                splitTestId: splitTest.id,
                variantId: selectedVariant.id,
                type: 'VIEW'
              }
            })
        ]);
      } catch (e) {
          console.error("Failed to track split test view", e);
      }
  };
  
  await trackView();

  // Redirect to the selected lead page
  // We pass query params to track tracking
  redirect(`/p/${selectedVariant.leadPage.slug}?st=${splitTest.id}&v=${selectedVariant.id}`);
}
