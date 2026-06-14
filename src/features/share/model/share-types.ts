export interface IncomingShare {
  shareId: string;
  type: 'template' | 'checklist';
  senderDeviceId: string;
  senderName?: string;
  title: string;
  data: string;
  sharedAt: number;
  receivedAt: number;
  status: 'pending' | 'accepted' | 'dismissed';
}

export interface ContactCode {
  deviceId: string;
  name?: string;
}
