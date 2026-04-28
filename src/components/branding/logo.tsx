import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#4bd6ff,#ff8e78)] font-semibold text-[#140a21] shadow-[0_10px_24px_rgba(75,214,255,0.18)]">
        IV
      </span>
      <span className="flex flex-col">
        <span className="public-display text-base tracking-[0.18em] text-slate-900">INOVAVERSO</span>
        <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Portal editorial tech</span>
      </span>
    </Link>
  );
}
