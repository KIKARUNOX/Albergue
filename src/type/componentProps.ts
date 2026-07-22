import type { ReactNode } from "react";

export type PageSectionProps = {
  title: string;
  children: ReactNode;
};

export type ExcelRow = Record<string, unknown>;
