export interface IncomingShare {
  shareId: string;
  type: 'template' | 'checklist';
  senderDeviceId: string;
  senderName?: string;
  title: string;
  data: string;
  photos?: Record<string, string>;
  sharedAt: number;
  receivedAt: number;
  status: 'pending' | 'accepted' | 'dismissed';
}

export interface ContactCode {
  deviceId: string;
  name?: string;
}
