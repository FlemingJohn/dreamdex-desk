import { BotAccessPanel } from "@/components/dashboard/BotAccessPanel";
import { PortfolioPanel } from "@/components/dashboard/PortfolioPanel";

/**
 * Your account, and what is allowed to act for it.
 */
export default function PortfolioPage() {
  return (
    <>
      <PortfolioPanel />
      <BotAccessPanel />
    </>
  );
}
