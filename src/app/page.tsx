import SignOutButton from "@/components/auth/signOut";
import { getCurrentUser } from "@/lib/admin-auth";

export default async function Home() {
  const userSession = await getCurrentUser();

  return (
    <>
      WELCOME
      <div>{userSession && <SignOutButton />}</div>
    </>
  );
}
