import { ConfirmDialog } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';

interface ValidationDialogProps {
  message: string;
  onClose: () => void;
}

export function ValidationDialog({ message, onClose }: ValidationDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      title={t.validation.requiredTitle}
      message={message}
      confirmLabel={t.common.ok}
      variant="warning"
      onConfirm={onClose}
      onCancel={onClose}
    />
  );
}
