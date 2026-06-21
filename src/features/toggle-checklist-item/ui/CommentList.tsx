import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import type { ChecklistComment } from '@/shared/config';

interface CommentListProps {
  comments: ChecklistComment[];
  onDeleteComment?: (commentId: string) => void;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, onDeleteComment }) => {
  const { t } = useTranslation();

  if (comments.length === 0) return null;

  return (
    <div style={{ paddingLeft: '28px' }} className="mt-2 space-y-1.5">
      <span className="text-2xs text-tertiary font-medium tracking-wide">{t.item.comments}</span>
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-1.5 group">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">{c.text}</p>
            <span className="text-2xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
          </div>
          {onDeleteComment && (
            <button
              onClick={() => onDeleteComment(c.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-tertiary hover:text-danger"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
