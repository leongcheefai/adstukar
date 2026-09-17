import { CaretUpDown, SignOut } from "@phosphor-icons/react";
import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../primitives/dropdown-menu";

export interface SidebarUserMenuProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onSignOut?: () => void;
  /** `DropdownMenuItem`s placed above the logout entry. */
  children?: React.ReactNode;
}

function initial(userName?: string | null, userEmail?: string | null) {
  return (userName ?? userEmail ?? "?").trim().charAt(0).toUpperCase() || "?";
}

export function SidebarUserMenu({
  userName,
  userEmail,
  userImage,
  onSignOut,
  children,
}: SidebarUserMenuProps) {
  const label = userName ?? userEmail ?? "Account";

  /* 32px, not the 24px "sm": it is the exact height of the two-line name and
     email block beside it, so the row reads as one object rather than a small
     dot next to text. */
  const avatar = (
    <Avatar className="shrink-0">
      {userImage && <AvatarImage src={userImage} alt={label} />}
      <AvatarFallback className="bg-on-air text-xs font-semibold text-on-air-foreground">
        {initial(userName, userEmail)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-accent"
          aria-label="Account menu"
        >
          {avatar}
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium leading-tight">{label}</span>
            {userEmail && userName && (
              <span className="block truncate text-xs text-muted-foreground">{userEmail}</span>
            )}
          </span>
          <CaretUpDown size={14} className="shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-56"
        portalled={false}
      >
        {children}
        {children && onSignOut && <DropdownMenuSeparator />}
        {onSignOut && (
          <DropdownMenuItem onSelect={onSignOut} className="text-muted-foreground">
            <SignOut size={14} className="mr-2" />
            Logout
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
