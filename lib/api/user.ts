export async function getMyProfile(token?: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  const res = await fetch(`${base}/api/auth/me`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Failed to fetch profile');
  }
  return res.json() as Promise<{ success: boolean; data: {
    id: string; firstName: string; lastName: string; email: string; role: string;
    planType: string; subscriptionStatus: string | null; currentDiscount: number; activePlan: string;
    createdAt: string; updatedAt: string;
  } }>;
}