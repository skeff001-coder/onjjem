import AsyncStorage from "@react-native-async-storage/async-storage";

export type Inquiry = {
  id: string;
  email: string;
  question: string;
  photoUri: string | null;
  submittedAt: string;
  read: boolean;
};

const INQUIRIES_KEY = "@onjjem_inquiries";

export async function loadInquiries(): Promise<Inquiry[]> {
  const raw = await AsyncStorage.getItem(INQUIRIES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Inquiry[];
}

export async function saveInquiries(inquiries: Inquiry[]): Promise<void> {
  await AsyncStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
}

export async function addInquiry(
  data: Pick<Inquiry, "email" | "question" | "photoUri">,
): Promise<Inquiry> {
  const inquiries = await loadInquiries();
  const newInquiry: Inquiry = {
    ...data,
    id: `inq_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    read: false,
  };
  await saveInquiries([newInquiry, ...inquiries]);
  return newInquiry;
}

export async function markInquiryRead(id: string): Promise<void> {
  const inquiries = await loadInquiries();
  const updated = inquiries.map((i) => (i.id === id ? { ...i, read: true } : i));
  await saveInquiries(updated);
}
