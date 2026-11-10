
import { Suspense } from "react";

import {
  getAppearance
} from "@/lib/appearance";

import {
  AuthForm
} from "@/components/auth-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join Karma Curated"
};

export default async function Page() {
  const visuals = await getAppearance();

  return (
    <Suspense
      fallback={
        <main className="main-container page-pad">
          <h1>JOIN KARMA CURATED.</h1>
        </main>
      }
    >
      <AuthForm
        mode="register"
        cover={visuals.authHero}
      />
    </Suspense>
  );
}
