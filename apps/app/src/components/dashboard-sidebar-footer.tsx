import { ChatCenteredDots } from "@phosphor-icons/react";
import { DropdownMenuItem, SidebarUserMenu } from "@repo/ui";
import { useState } from "react";
import { FeedbackDialog } from "./feedback-dialog";

export interface DashboardSidebarFooterProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onSignOut: () => void;
}

/**
 * Bottom-left block of the sidebar. The account menu is the only control.
 */
export function DashboardSidebarFooter({
  userName,
  userEmail,
  userImage,
  onSignOut,
}: DashboardSidebarFooterProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <SidebarUserMenu
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={onSignOut}
      >
        <DropdownMenuItem
          onSelect={(event) => {
            // Keep the dialog mounted while the menu closes.
            event.preventDefault();
            setFeedbackOpen(true);
          }}
          className="text-muted-foreground"
        >
          <ChatCenteredDots size={14} className="mr-2" />
          Send feedback
        </DropdownMenuItem>
      </SidebarUserMenu>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
