import type { Metadata } from "next";
import "./globals.css";
import "./operator.css";

export const metadata: Metadata = {
  title: "ReserveCovenant | On-chain reserve assurance",
  description: "GEN-backed reserve assessments for stablecoins and wrapped assets, settled by GenLayer consensus."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
