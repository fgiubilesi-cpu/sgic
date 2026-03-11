'use client';

import { Badge } from '@/components/ui/badge';
import {
  getOperationalStatusMeta,
  type OperationalStatus,
} from '@/features/personnel/lib/personnel-status';

interface PersonnelOperationalBadgeProps {
  status: OperationalStatus;
}

export function PersonnelOperationalBadge({
  status,
}: PersonnelOperationalBadgeProps) {
  const meta = getOperationalStatusMeta(status);

  return (
    <Badge variant="outline" className={meta.badgeClassName}>
      {meta.label}
    </Badge>
  );
}
