import AsyncStorage from "@react-native-async-storage/async-storage";

export type Order = {
  id: string;
  customerName: string;
  customerAddress: string;
  product: string;
  retailPrice: number;
  tradeCost: number;
  photoUri: string | null;
  orderedAt: string;
  markedAsOrdered: boolean;
};

const ORDERS_KEY = "@onjjem_orders";

const SAMPLE_ORDERS: Order[] = [
  {
    id: "ord_001",
    customerName: "Sarah Mitchell",
    customerAddress: "14 Oakfield Road, Bristol, BS6 7AH",
    product: "Premium Canvas (A2)",
    retailPrice: 49.99,
    tradeCost: 14.00,
    photoUri: null,
    orderedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    markedAsOrdered: false,
  },
  {
    id: "ord_002",
    customerName: "James O'Brien",
    customerAddress: "7 Maple Avenue, Dublin, D04 X2Y1",
    product: "Photo Bed Quilt (King)",
    retailPrice: 195.00,
    tradeCost: 78.00,
    photoUri: null,
    orderedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    markedAsOrdered: false,
  },
  {
    id: "ord_003",
    customerName: "Emma Thornton",
    customerAddress: "22 Church Lane, Edinburgh, EH1 2AN",
    product: "Large Format Print (A1)",
    retailPrice: 39.99,
    tradeCost: 8.00,
    photoUri: null,
    orderedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    markedAsOrdered: true,
  },
  {
    id: "ord_004",
    customerName: "Liam Walsh",
    customerAddress: "9 Harbour View, Galway, H91 A1B2",
    product: "Photo Keyring (Set of 3)",
    retailPrice: 38.97,
    tradeCost: 9.00,
    photoUri: null,
    orderedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    markedAsOrdered: false,
  },
];

export async function loadOrders(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  if (raw) return JSON.parse(raw) as Order[];
  // First run — seed with sample orders
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(SAMPLE_ORDERS));
  return SAMPLE_ORDERS;
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function addOrder(order: Omit<Order, "id" | "orderedAt" | "markedAsOrdered">): Promise<Order> {
  const orders = await loadOrders();
  const newOrder: Order = {
    ...order,
    id: `ord_${Date.now()}`,
    orderedAt: new Date().toISOString(),
    markedAsOrdered: false,
  };
  await saveOrders([newOrder, ...orders]);
  return newOrder;
}

export async function markOrderAsOrdered(id: string): Promise<void> {
  const orders = await loadOrders();
  const updated = orders.map((o) => (o.id === id ? { ...o, markedAsOrdered: true } : o));
  await saveOrders(updated);
}

export function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
