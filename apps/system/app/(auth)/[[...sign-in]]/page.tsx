'use client'
import { SignIn, SignOutButton } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/shadcn/button";
import { Authenticated, Unauthenticated } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { UserSchools } from "components/UserSchools";

export default function AuthPage() {
  const { user } = useUser();
  return (
    <div>
        <Authenticated>
          <div className="flex flex-col items-center justify-center">

            <UserSchools clerkId={user?.id} />
            <Button asChild className="mt-4 bg-red-500 hover:bg-red-600 text-white rounded-full cursor-pointer">
              <SignOutButton />
            </Button>

          </div>
        </Authenticated>
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center h-screen">
              <SignIn />
          </div>
        </Unauthenticated>
    </div>
  );
}