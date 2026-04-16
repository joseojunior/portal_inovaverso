type ResponsiveVideoEmbedProps = {
  embedUrl: string;
  title: string;
  className?: string;
};

export function ResponsiveVideoEmbed({ embedUrl, title, className }: ResponsiveVideoEmbedProps) {
  return (
    <div className={className}>
      <div className="relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
