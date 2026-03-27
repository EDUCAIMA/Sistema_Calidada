import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export interface DocumentHeaderProps {
  /** The full name/title of the document */
  title: string;
  /** The standard ISO code of the document (e.g., APO-PRO-001) */
  code: string;
  /** The current version number */
  version: string | number;
  /** The date the document was approved (or created, depending on context) */
  approvalDate: string | Date;
  /** The URL of the tenant's logo */
  logoUrl?: string;
  /** Optional class name to add to the wrapper */
  className?: string;
}

export function DocumentHeader({
  title,
  code,
  version,
  approvalDate,
  logoUrl,
  className,
}: DocumentHeaderProps) {
  // Format the date based on its type
  const formattedDate = React.useMemo(() => {
    if (!approvalDate) return 'N/A';
    if (approvalDate instanceof Date) {
      return approvalDate.toLocaleDateString();
    }
    // Try to parse string as date first if it looks like ISO
    if (typeof approvalDate === 'string' && approvalDate.includes('T')) {
      return new Date(approvalDate).toLocaleDateString();
    }
    return approvalDate;
  }, [approvalDate]);

  return (
    <div
      className={cn(
        'w-full border-2 border-slate-800 bg-white grid grid-cols-12 min-h-[100px] mb-8 font-sans print:border-black print:mb-6',
        className
      )}
    >
      {/* Logo Section */}
      <div className="col-span-3 border-r-2 border-slate-800 flex items-center justify-center p-4 print:border-black">
        {logoUrl ? (
          <div className="relative w-full h-full min-h-[60px] flex items-center justify-center">
             {/* Using standard img for wider compatibility especially in print/PDF scenarios compared to Next Image which sometimes has lazy loading issues */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="max-h-[80px] object-contain"
            />
          </div>
        ) : (
          <div className="text-xl font-bold text-slate-400 select-none tracking-widest uppercase">
            LOGO EMPRESA
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="col-span-6 border-r-2 border-slate-800 flex items-center justify-center p-6 print:border-black">
        <h2 className="text-xl leading-tight font-black text-slate-900 uppercase text-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md print:text-lg">
          {title || 'TÍTULO DEL DOCUMENTO'}
        </h2>
      </div>

      {/* Metadata Section */}
      <div className="col-span-3 grid grid-rows-3 h-full divide-y-2 divide-slate-800 print:divide-black">
        
        {/* Code row */}
        <div className="grid grid-cols-3 h-full">
            <div className="col-span-1 border-r-2 border-slate-800 flex items-center px-2 py-1 bg-slate-50 print:bg-transparent print:border-black">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter w-full text-center print:text-black">Código</span>
            </div>
            <div className="col-span-2 flex items-center px-3 py-1 justify-center">
                <span className="text-sm font-black text-slate-800 truncate">{code || '-'}</span>
            </div>
        </div>

        {/* Version row */}
        <div className="grid grid-cols-3 h-full">
            <div className="col-span-1 border-r-2 border-slate-800 flex items-center px-2 py-1 bg-slate-50 print:bg-transparent print:border-black">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter w-full text-center print:text-black">Versión</span>
            </div>
            <div className="col-span-2 flex items-center px-3 py-1 justify-center">
                <span className="text-sm font-black text-slate-800">{version || '01'}</span>
            </div>
        </div>

        {/* Date row */}
        <div className="grid grid-cols-3 h-full">
            <div className="col-span-1 border-r-2 border-slate-800 flex items-center px-2 py-1 bg-slate-50 print:bg-transparent print:border-black">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter w-full text-center print:text-black">Fecha</span>
            </div>
            <div className="col-span-2 flex items-center px-3 py-1 justify-center">
                <span className="text-sm font-bold text-slate-800 truncate">{formattedDate}</span>
            </div>
        </div>

      </div>
    </div>
  );
}

export default DocumentHeader;
