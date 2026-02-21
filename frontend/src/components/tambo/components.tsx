import React from "react";
import { z } from "zod";
import type { TamboComponent } from "@tambo-ai/react"; // adjust if needed
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
    api
      .inventoryByName(productName)
      .then((r) => setData(r.results))
      .catch((e) => setErr(e.message));
  }, [productName]);

  if (err) return <div>Error: {err}</div>;
  if (!data) return <div>Loading inventory…</div>;

  return (
    <div>
      <h3>Inventory: {productName}</h3>
      <ul>
        {data.map((row, i) => (
          <li key={i}>
            {row.branchName ?? row.branch_name}: {row.quantity}
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
    (async () => {
      try {
        const search = await api.customerSearch(customerName);
        const best = search.results?.[0];
        if (!best?.id) throw new Error("No matching customer found");
        const [p, h] = await Promise.all([
          api.customerById(best.id),
          api.customerHistory(best.id),
        ]);
        setProfile(p);
        setHistory(h);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [customerName]);

  if (err) return <div>Error: {err}</div>;
  if (!profile) return <div>Loading customer…</div>;

  return (
    <div>
      <h3>{profile.name ?? `${profile.first_name} ${profile.last_name}`}</h3>
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

// 3) PersistentCartPanel (AI adds items / shows current cart)
const PersistentCartPanelProps = z.object({
  // optional: allow AI to add items by name + qty
  addItemName: z.string().optional(),
  addItemQty: z.number().int().positive().optional(),
});

function PersistentCartPanel(props: z.infer<typeof PersistentCartPanelProps>) {
  const [cart, setCart] = React.useState<any | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function ensureCart() {
    let id = getSavedCartId();
    if (!id) {
      const created = await api.createCart();
      id = created.id ?? created.cartId ?? created.cart_id;
      if (!id) throw new Error("Cart create returned no id");
      saveCartId(id);
    }
    return id;
  }

  React.useEffect(() => {
    (async () => {
      try {
        const id = await ensureCart();
        // If AI provided an addItem, call updateCart
        if (props.addItemName && props.addItemQty) {
          await api.updateCart(id, {
            productName: props.addItemName,
            quantity: props.addItemQty,
          });
        }
        const fresh = await api.getCart(id);
        setCart(fresh);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.addItemName, props.addItemQty]);

  if (err) return <div>Error: {err}</div>;
  if (!cart) return <div>Loading cart…</div>;

  return (
    <div>
      <h3>Cart #{cart.id}</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(cart, null, 2)}
      </pre>
    </div>
  );
}

// 4) SalesTodayChart (you can swap pre -> real chart later)
const SalesTodayChartProps = z.object({}); // no props needed

function SalesTodayChart() {
  const [data, setData] = React.useState<any | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .salesToday()
      .then(setData)
      .catch((e) => setErr(e.message));
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
