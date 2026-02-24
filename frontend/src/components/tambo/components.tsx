import React from "react";
import { z } from "zod";
import type { TamboComponent } from "@tambo-ai/react";
import { api } from "../../lib/api";
import { saveCartId, getSavedCartId } from "../../lib/cartSession";

// 1) InventoryStatus
const InventoryStatusProps = z.object({
  productName: z.string().min(1),
});

function InventoryStatus({
  productName,
}: z.infer<typeof InventoryStatusProps>) {
  const [data, setData] = React.useState<any[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setErr(null);
    setData(null);

    api
      .inventoryByName(productName)
      .then((r) => {
        if (!cancelled) setData(r.results ?? []);
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message ?? String(e));
      });

    return () => {
      cancelled = true;
    };
  }, [productName]);

  if (err) return <div>Error: {err}</div>;
  if (!data) return <div>Loading inventory…</div>;

  return (
    <div>
      <h3>Inventory: {productName}</h3>
      <ul>
        {data.map((row, i) => (
          <li key={i}>
            {row.branchName ?? row.branch_name ?? "Branch"}: {row.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 2) CustomerLoyaltyCard
const CustomerLoyaltyCardProps = z.object({
  customerName: z.string().min(1),
});

function CustomerLoyaltyCard({
  customerName,
}: z.infer<typeof CustomerLoyaltyCardProps>) {
  const [profile, setProfile] = React.useState<any | null>(null);
  const [history, setHistory] = React.useState<any | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setErr(null);
    setProfile(null);
    setHistory(null);

    (async () => {
      try {
        const search = await api.customerSearch(customerName);
        const best = search.results?.[0];
        if (!best?.id) throw new Error("No matching customer found");

        const idNum = Number(best.id);
        if (!Number.isFinite(idNum)) throw new Error("Invalid customer id");

        const [p, h] = await Promise.all([
          api.customerById(idNum),
          api.customerHistory(idNum),
        ]);

        if (!cancelled) {
          setProfile(p);
          setHistory(h);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerName]);

  if (err) return <div>Error: {err}</div>;
  if (!profile) return <div>Loading customer…</div>;

  return (
    <div>
      <h3>
        {profile.name ??
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()}
      </h3>
      <div>Customer ID: {profile.id}</div>

      <h4>Recent purchases</h4>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {history
          ? JSON.stringify(history.history ?? history, null, 2)
          : "Loading history…"}
      </pre>
    </div>
  );
}

// 3) PersistentCartPanel
const PersistentCartPanelProps = z.object({
  addItemName: z.string().optional(),
  addItemQty: z.number().int().positive().optional(),
});

function PersistentCartPanel(props: z.infer<typeof PersistentCartPanelProps>) {
  const { addItemName, addItemQty } = props;

  const [cart, setCart] = React.useState<any | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function ensureCart(): Promise<number> {
    const existing = getSavedCartId();
    if (existing) return existing;

    const created = await api.createCart();
    const raw = created.id ?? created.cartId ?? created.cart_id;
    const num = Number(raw);

    if (!Number.isFinite(num))
      throw new Error("Cart create returned no valid id");

    saveCartId(num);
    return num;
  }

  React.useEffect(() => {
    let cancelled = false;
    setErr(null);
    setCart(null);

    return () => {
      cancelled = true;
    };
  }, [addItemName, addItemQty]);

  if (err) return <div>Error: {err}</div>;
  if (!cart) return <div>Loading cart…</div>;

  return (
    <div>
      <h3>Cart #{cart.id ?? cart.cartId}</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(cart, null, 2)}
      </pre>
    </div>
  );
}

// 4) SalesTodayChart
const SalesTodayChartProps = z.object({});

function SalesTodayChart() {
  const [data, setData] = React.useState<any | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setErr(null);
    setData(null);

    api
      .salesToday()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setErr(e?.message ?? String(e));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <div>Error: {err}</div>;
  if (!data) return <div>Loading sales…</div>;

  return (
    <div>
      <h3>Today’s Sales</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export const components: TamboComponent[] = [
  {
    name: "InventoryStatus",
    description: "Shows inventory for a product across all branches.",
    propsSchema: InventoryStatusProps,
    component: InventoryStatus,
  },
  {
    name: "CustomerLoyaltyCard",
    description: "Shows a customer profile and recent purchase history.",
    propsSchema: CustomerLoyaltyCardProps,
    component: CustomerLoyaltyCard,
  },
  {
    name: "PersistentCartPanel",
    description: "Shows the active cart and can add an item if specified.",
    propsSchema: PersistentCartPanelProps,
    component: PersistentCartPanel,
  },
  {
    name: "SalesTodayChart",
    description: "Shows today's sales summary (can be graphed).",
    propsSchema: SalesTodayChartProps,
    component: SalesTodayChart,
  },
];
