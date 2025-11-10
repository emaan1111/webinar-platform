import { redirect } from 'next/navigation';

interface PageProps {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default function LegacyLivePage({ params, searchParams }: PageProps) {
  const query = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) {
          query.append(key, item);
        }
      });
    } else if (value != null) {
      query.set(key, value);
    }
  });

  const suffix = query.toString();
  redirect(`/room/${params.slug}${suffix ? `?${suffix}` : ''}`);
}
