import type { ReactNode } from "react";
import { AskAboutButton } from "@/components/dashboard/AskAboutButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PanelShellProps {
  title: string;
  description: string;
  /** Optional badge or control shown on the right of the header. */
  headerExtra?: ReactNode;
  /** When set, shows an Ask button that puts this question to the copilot. */
  askQuestion?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Every analytics panel sits in the same frame — a title, a one-line
 * explanation of what the reader is looking at, and the content.
 *
 * The description is not decoration. Each panel measures something unfamiliar,
 * and a reader who does not know what calibration is should still understand
 * the panel from its header alone.
 */
export function PanelShell({
  title,
  description,
  headerExtra,
  askQuestion,
  children,
  className,
}: PanelShellProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="ml-auto flex items-center gap-1">
          {headerExtra}
          {askQuestion ? <AskAboutButton question={askQuestion} /> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
