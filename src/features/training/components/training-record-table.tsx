"use client";

import type { Tables } from "@/types/database.types";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TrainingRecordRow = Tables<"training_records"> & {
  training_courses?: Pick<Tables<"training_courses">, "title"> | null;
};

interface TrainingRecordTableProps {
  records: TrainingRecordRow[];
  showPerson?: boolean;
}

export function TrainingRecordTable({ records }: TrainingRecordTableProps) {
  if (!records || records.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4 text-center">
        Nessun corso registrato.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Corso</TableHead>
          <TableHead>Completamento</TableHead>
          <TableHead>Scadenza</TableHead>
          <TableHead>Stato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const course = record.training_courses;
          const isExpired =
            record.expiry_date && new Date(record.expiry_date) < new Date();

          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {course?.title ?? record.course_id}
              </TableCell>
              <TableCell>
                {format(new Date(record.completion_date), "dd MMM yyyy", { locale: it })}
              </TableCell>
              <TableCell>
                {record.expiry_date
                  ? format(new Date(record.expiry_date), "dd MMM yyyy", { locale: it })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    isExpired
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {isExpired ? "Scaduto" : "Valido"}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
