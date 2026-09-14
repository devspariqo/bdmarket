import { Box, Info, Package, Sparkles } from 'lucide-react';

/**
 * Product specifications, grouped and formatted.
 *
 * The old version dumped every key into one flat striped table, mixing product
 * identity (SKU, brand) with material data (fabric, care) and shipping data
 * (weight, origin). Grouping makes a long spec list scannable, and lets us show
 * a proper empty state instead of a headerless empty table.
 *
 * Rows with no value are dropped, so a sparse product shows a short honest table
 * rather than a wall of dashes.
 */

// Values arrive from mixed sources — some are strings, weight/dimensions are
// numeric — so the type is widened here and normalised at render.
type SpecValue = string | number | null | undefined;
type Row = { label: string; value: SpecValue };
type Group = { title: string; icon: any; rows: Row[] };

export default function ProductSpecs({
  sku,
  barcode,
  type,
  category,
  brand,
  stockStatus,
  stock,
  attributes = [],
  fabric,
  fit,
  occasion,
  careInstructions,
  countryOfOrigin,
  weight,
  dimensions,
}: {
  sku?: string | null;
  barcode?: string | null;
  type?: string | null;
  category?: string | null;
  brand?: string | null;
  stockStatus?: string | null;
  stock?: number | null;
  attributes?: { name: string; values: string[] }[];
  fabric?: string | null;
  fit?: string | null;
  occasion?: string | null;
  careInstructions?: string | null;
  countryOfOrigin?: string | null;
  weight?: string | number | null;
  dimensions?: string | null;
}) {
  const stockLabel =
    stockStatus === 'outofstock' || (typeof stock === 'number' && stock <= 0)
      ? 'Out of stock'
      : stockStatus === 'onbackorder'
      ? 'Available on backorder'
      : typeof stock === 'number'
      ? `In stock${stock > 0 && stock <= 10 ? ` — only ${stock} left` : ''}`
      : 'In stock';

  const groups: Group[] = [
    {
      title: 'Product Information',
      icon: Info,
      rows: [
        { label: 'SKU', value: sku },
        { label: 'Barcode', value: barcode },
        { label: 'Product type', value: type === 'variable' ? 'Variable product' : type ? 'Simple product' : null },
        { label: 'Category', value: category },
        { label: 'Brand', value: brand },
        { label: 'Availability', value: stockLabel },
      ],
    },
    {
      title: 'Specifications',
      icon: Sparkles,
      // Attributes are merchant-defined, so they come through as-is.
      rows: attributes.flatMap((a) => ({
        label: a.name,
        value: a.values?.length ? a.values.join(', ') : null,
      })),
    },
    {
      title: 'Material & Care',
      icon: Package,
      rows: [
        { label: 'Fabric', value: fabric },
        { label: 'Fit', value: fit },
        { label: 'Occasion', value: occasion },
        { label: 'Care instructions', value: careInstructions },
      ],
    },
    {
      title: 'Shipping & Origin',
      icon: Box,
      rows: [
        { label: 'Country of origin', value: countryOfOrigin },
        { label: 'Weight', value: weight },
        { label: 'Dimensions', value: dimensions },
      ],
    },
  ]
    // Drop empty groups and empty rows together.
    .map((g) => ({ ...g, rows: g.rows.filter((r) => r.value && String(r.value).trim()) }))
    .filter((g) => g.rows.length > 0);

  if (!groups.length) {
    return (
      <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-10 text-center text-[15px] text-ink-500">
        No specifications have been added for this product yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="mb-2.5 flex items-center gap-2 text-[15px] font-bold text-ink-900">
            <g.icon className="h-4 w-4 text-brand-600" />
            {g.title}
          </h3>

          <div className="overflow-hidden rounded-2xl border border-ink-200">
            <table className="w-full border-collapse text-[15px]">
              <tbody>
                {g.rows.map((r, i) => (
                  <tr
                    key={`${r.label}-${i}`}
                    className={i % 2 ? 'bg-ink-50/50' : 'bg-white'}
                  >
                    <th
                      scope="row"
                      className="w-[38%] px-4 py-3 text-left align-top text-[13px] font-bold uppercase tracking-wide text-ink-500 sm:w-44"
                    >
                      {r.label}
                    </th>
                    <td className="px-4 py-3 align-top font-medium text-ink-800">
                      {/* Availability reads better with a status dot than bare text. */}
                      {r.label === 'Availability' ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={
                              'h-2 w-2 rounded-full ' +
                              (stockLabel.startsWith('Out')
                                ? 'bg-rose-500'
                                : stockLabel.startsWith('Available')
                                ? 'bg-amber-500'
                                : 'bg-emerald-500')
                            }
                          />
                          {r.value}
                        </span>
                      ) : (
                        r.value
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
