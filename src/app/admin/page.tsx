import { ChartAreaInteractive } from '@/components/admin/chart-area';
import { DataTable } from '@/components/admin/data-table';
import { SectionCards } from '@/components/admin/section-cards';
import React from 'react'
import data from '@/app/admin/data.json';
import { cardData } from '@/data/mockdata';

export default function Dashboard() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards cardData={cardData} />
        <div className="px-4 lg:px-6"><ChartAreaInteractive /></div>
        <DataTable data={data} />
      </div>
    </div>
  );
}
