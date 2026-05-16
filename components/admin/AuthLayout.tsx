import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

const LOGO_URL =
  "https://arnav-sharma437.github.io/Katoch-Organic-Farm/images/logo.jpg";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f7f2] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src={LOGO_URL}
            alt="Katoch Organic Farm"
            width={120}
            height={120}
            className="mb-4 rounded-full object-cover"
            priority
          />
          <h1 className="text-2xl font-semibold text-[#2d5a27]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AuthBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-[#2d5a27] hover:underline">
      {children}
    </Link>
  );
}
