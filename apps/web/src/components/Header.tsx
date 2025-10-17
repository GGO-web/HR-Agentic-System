import { SignOutButton, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Link, useRouter } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { User, Building2, LogOut, LogIn, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { isSignedIn, isHRManager, role } = useAuth();
  const { signOut } = useClerkAuth();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className="flex justify-between gap-2 p-4 shadow-sm">
      <nav className="flex flex-row items-center gap-4">
        <Link
          to={router.routesByPath["/"].fullPath}
          className="flex items-center gap-2 font-bold"
        >
          <img src="/logo.png" alt={t("header.logoAlt")} className="h-8 w-8" />
          <span className="hidden md:block">{t("header.logoAlt")}</span>
        </Link>

        {isSignedIn && (
          <Link to={router.routesByPath["/dashboard"].fullPath}>
            {t("navigation.dashboard")}
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {isSignedIn && role && (
          <div className="text-deep-blue hidden items-center gap-2 md:flex">
            {isHRManager ? (
              <Building2 className="size-4" />
            ) : (
              <User className="size-4" />
            )}

            <Badge variant="secondary" className="text-xs">
              {isHRManager ? t("header.hrManager") : t("header.candidate")}
            </Badge>
          </div>
        )}

        {isSignedIn ? (
          <SignOutButton>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="size-4" />
              <span className="hidden md:block">{t("navigation.signOut")}</span>
            </Button>
          </SignOutButton>
        ) : (
          <div className="flex gap-2">
            <Link to={router.routesByPath["/sign-in"].fullPath}>
              <Button variant="outline" size="sm">
                <LogIn className="size-4" />
                <span className="hidden md:block">
                  {t("navigation.signIn")}
                </span>
              </Button>
            </Link>
            <Link to={router.routesByPath["/sign-up"].fullPath}>
              <Button size="sm">
                <UserPlus className="size-4" />
                <span className="hidden md:block">
                  {t("navigation.signUp")}
                </span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
