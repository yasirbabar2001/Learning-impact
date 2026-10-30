export const FORMATS = ["onsite", "virtual", "hybrid"] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_LABELS: Record<Format, string> = {
  onsite: "On-site",
  virtual: "Live virtual",
  hybrid: "Hybrid",
};

export const REQUEST_TYPES = ["program_booking", "trainer_request", "enquiry"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  program_booking: "Program booking",
  trainer_request: "Trainer request",
  enquiry: "General enquiry",
};

export const REQUEST_STATUSES = ["new", "contacted", "proposal", "confirmed", "closed"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  proposal: "Proposal sent",
  confirmed: "Confirmed",
  closed: "Closed",
};

export type Program = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  outcomes: string[];
  duration: string;
  formats: Format[];
  level: string;
  featured: boolean;
  published: boolean;
  sort: number;
};

export type TrainingRequest = {
  id: string;
  reference: string;
  type: RequestType;
  status: RequestStatus;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  participants: number | null;
  format: Format | null;
  preferredDate: string | null;
  programSlug: string | null;
  programTitle: string | null;
  message: string;
  details: Record<string, string>;
  notes: string;
  createdAt: string;
};

export type NewRequest = Omit<TrainingRequest, "id" | "reference" | "status" | "notes" | "createdAt">;

export type SiteSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  announcement: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  linkedin: string;
  instagram: string;
  facebook: string;
};
