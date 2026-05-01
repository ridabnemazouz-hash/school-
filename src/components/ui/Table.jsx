import React from 'react';
import { cn } from '../../utils';

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full text-sm text-left', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn('text-xs text-slate-500 uppercase bg-slate-50/50 border-y border-slate-200', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr className={cn('border-b border-slate-100 hover:bg-slate-50/50 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn('px-6 py-3 font-medium', className)} {...props}>
      {children}
    </th>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn('px-6 py-4', className)} {...props}>
      {children}
    </td>
  );
}
