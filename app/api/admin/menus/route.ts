import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * The only menu locations the storefront reads.
 *
 * Kept in step with the `safeMenu(...)` calls in `app/(store)/layout.tsx` and
 * the `LOCATIONS` list in `components/admin/MenuBuilder.tsx`. `Menu.location` is
 * `@unique`, so a typo would quietly create an orphan row that no component ever
 * queries — the merchant would see "Saved" and nothing would change. Rejecting
 * unknown values turns that into a visible error instead.
 */
const LOCATIONS = ['header', 'mobile', 'footer-1', 'footer-2', 'footer-3'] as const;

/**
 * POST /api/admin/menus
 * Body: { id?, name, location, items: [{label, labelBn, href, children?}], status }
 * `items` is persisted as a JSON string. Without an `id` the row is upserted on
 * `location`, so this creates a menu that does not exist yet.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.location) {
    return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
  }

  const location = String(body.location);
  if (!(LOCATIONS as readonly string[]).includes(location)) {
    return NextResponse.json(
      { error: `Unknown menu location "${location}". Expected one of: ${LOCATIONS.join(', ')}` },
      { status: 400 }
    );
  }

  const data = {
    name: String(body.name),
    location,
    items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
    status: body.status || 'active',
  };

  try {
    let menu;
    if (body.id) {
      menu = await prisma.menu.update({ where: { id: body.id }, data });
    } else {
      menu = await prisma.menu.upsert({
        where: { location: data.location },
        update: data,
        create: data,
      });
    }

    /**
     * The storefront layout renders per request, but Next keeps the shared
     * layout payload in the client-side Router Cache. Without this, a merchant
     * who saves a menu and then clicks through to the shop keeps seeing the old
     * header and footer until that cache expires — which reads as "the menu
     * never saved". Invalidating the root layout clears every route beneath it.
     */
    revalidatePath('/', 'layout');

    return NextResponse.json({ ok: true, menu });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save menu' }, { status: 500 });
  }
}

/** DELETE /api/admin/menus?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.menu.delete({ where: { id } });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
