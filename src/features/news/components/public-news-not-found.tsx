import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PublicNewsNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(19,10,36,0.96),rgba(10,7,23,0.9))] px-6 py-10 sm:px-8 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff8c7a]">Conteudo indisponivel</p>
        <h1 className="public-display mt-5 max-w-3xl text-4xl leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
          Esta materia nao esta disponivel no momento.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/66">
          Ela pode ter sido removida, alterada ou ainda nao estar liberada para leitura.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-[#52d4ff] px-6 text-[#100919] hover:bg-[#74ddff]">
            <Link href="/">Voltar para a home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/8">
            <Link href="/editoria">Explorar editorias</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
