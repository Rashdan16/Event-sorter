export interface ExtractedEventData {
  name: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  ticketUrl: string | null;
  description: string | null;
}

export interface EventFormData {
  name: string;
  description?: string;
  location?: string;
  date: string;
  time?: string;
  ticketUrl?: string;
  imageUrl?: string;
}
