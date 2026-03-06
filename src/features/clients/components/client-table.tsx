import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

interface ClientWithStats extends ClientRow {
  location_count: number;
  last_audit_date: string | null;
}

interface ClientTableProps {
  clients: ClientWithStats[];
}

export function ClientTable({ clients }: ClientTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome Cliente</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-center">Sedi</TableHead>
          <TableHead>Ultimo Audit</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.email || '-'}</TableCell>
            <TableCell className="text-center">{client.location_count}</TableCell>
            <TableCell>
              {client.last_audit_date
                ? new Date(client.last_audit_date).toLocaleDateString('it-IT')
                : 'Mai'}
            </TableCell>
            <TableCell>
              <Badge variant={client.is_active ? 'default' : 'secondary'}>
                {client.is_active ? 'Attivo' : 'Inattivo'}
              </Badge>
            </TableCell>
            <TableCell>
              <Link
                href={`/clients/${client.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Dettagli
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
