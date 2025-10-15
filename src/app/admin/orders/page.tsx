import { DataTable } from "@/components/admin/data-table";
import { SectionCards } from "@/components/admin/section-cards";
import { Button } from "@/components/ui/button";
import { cardData } from "@/data/mockdata";
import { IconCirclePlus } from "@tabler/icons-react";
import React from "react";
import data from "../data.json";
import { productOrderColumns} from "@/data/tableColumnData";

export default function page() {
  return (
    <div className="@container/main flex flex-1 flex-col px-4 py-4 md:py-6 lg:px-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-semibold text-base">Order List</h1>
        <Button variant={"default"} size={"sm"} className="text-xs">
          <IconCirclePlus /> <span> Add Order</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards cardData={cardData} />
        <DataTable data={data} columns={productOrderColumns} />
      </div>
      
    </div>
  );
}

