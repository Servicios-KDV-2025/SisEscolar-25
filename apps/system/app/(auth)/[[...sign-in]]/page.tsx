'use client'
import { SignIn } from "@clerk/nextjs";
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