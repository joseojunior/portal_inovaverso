import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#4bd6ff,#ff8e78)] font-semibold text-[#140a21] shadow-[0_12px_30px_rgba(75,214,255,0.22)]">
        IV
      </span>
      <span className="flex flex-col">
        <span className="public-display text-base tracking-[0.18em] text-white">INOVAVERSO</span>
        <span className="text-xs uppercase tracking-[0.24em] text-white/48">Portal editorial tech</span>
      </span>
    </Link>
  );
}
