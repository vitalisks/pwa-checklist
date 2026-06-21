import React, { useRef, useState, useLayoutEffect } from 'react';
import { useTranslation } from '@/shared/i18n';

interface ItemDescriptionProps {
  description?: string;
}

export const ItemDescription: React.FC<ItemDescriptionProps> = ({ description }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const hasDescription = !!description && description.length > 0;

  useLayoutEffect(() => {
    const el = descRef.current;
    if (el && hasDescription && !expanded) {
      setClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, [description, expanded, hasDescription]);

  if (!hasDescription) return null;

  return (
    <div style={{ paddingLeft: '28px' }} className="mt-1">
      <p ref={descRef} className={`text-sm text-secondary leading-relaxed${expanded ? '' : ' line-clamp-3'}`}>
        {description}
      </p>
      {(clamped || expanded) && (
        <button onClick={() => setExpanded(!expanded)} className="text-2xs text-accent mt-0.5 hover:underline">
          {expanded ? t.common.seeLess : t.common.seeMore}
        </button>
      )}
    </div>
  );
};
