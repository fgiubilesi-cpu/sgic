"use client";

import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Users } from "lucide-react";
import { signOut } from "@/features/auth/actions/auth-actions";

type UserNavProps = {
  user: {
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
  };
};

export function UserNav({ user }: UserNavProps) {
  const [isPending, startTransition] = useTransition();

  const initials =
    user.fullName
      ?.split(" ")
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    user.email.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100"
          disabled={isPending}
        >
          <Avatar size="sm">
            {user.avatarUrl ? (
              <AvatarImage
                src={user.avatarUrl}
                alt={user.fullName ?? user.email}
              />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start text-left text-xs sm:flex">
            <span className="font-medium text-zinc-900">
              {user.fullName ?? user.email}
            </span>
            <span className="text-zinc-500">{user.email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">
            {user.fullName ?? "User Account"}
          </span>
          <span className="text-xs text-zinc-500 truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Users className="mr-2 h-4 w-4" />
          <span>Team</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
