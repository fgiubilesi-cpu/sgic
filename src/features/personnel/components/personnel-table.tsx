import Link from 'next/link';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '../queries/get-personnel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ManagePersonnelSheet } from './manage-personnel-sheet';

interface PersonnelTableProps {
  clientOptions: ClientOption[];
  personnel: PersonnelListItem[];
}

export function PersonnelTable({ clientOptions, personnel }: PersonnelTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Collaboratore</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Sede</TableHead>
          <TableHead>Ruolo</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personnel.map((person) => (
          <TableRow key={person.id}>
            <TableCell className="font-medium">
              {person.first_name} {person.last_name}
            </TableCell>
            <TableCell>{person.client_name || '-'}</TableCell>
            <TableCell>{person.location_name || '-'}</TableCell>
            <TableCell>{person.role || '-'}</TableCell>
            <TableCell>{person.email || '-'}</TableCell>
            <TableCell>
              <Badge variant={person.is_active ? 'default' : 'secondary'}>
                {person.is_active ? 'Attivo' : 'Inattivo'}
              </Badge>
            </TableCell>
            <TableCell className="flex items-center gap-1">
              <Link
                href={`/personnel/${person.id}`}
                className="inline-flex h-8 items-center rounded-md px-2 text-sm text-blue-600 hover:underline"
              >
                Dettagli
              </Link>
              <ManagePersonnelSheet clientOptions={clientOptions} personnel={person} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
