import React from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';

interface NotificationsSectionProps {
  notificationGranted: boolean;
  onRequest: () => void;
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ notificationGranted, onRequest }) => {
  const { t } = useTranslation();

  return (
    <div className="card">
      <button onClick={onRequest} className="flex items-center gap-3 w-full">
        <Bell size={18} className={notificationGranted ? 'text-accent' : 'text-secondary'} />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">{t.share.notifications}</p>
          <p className="text-2xs text-tertiary">
            {notificationGranted ? t.share.notificationsOn : t.share.notificationsOff}
          </p>
        </div>
      </button>
    </div>
  );
};

export default NotificationsSection;
