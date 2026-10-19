import { AccountOverview } from "@/components/account/AccountOverview";
import { SignedIn } from "@/components/account/AccountShell";

export default function AccountPage() {
  return (
    <SignedIn>
      <AccountOverview />
    </SignedIn>
  );
}
