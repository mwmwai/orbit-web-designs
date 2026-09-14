import { Button } from "./ui/button";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

const NAV_LINKS = ["Home", "Studio", "About", "Journal", "Reach Us"];

const displayFont = { fontFamily: "'Instrument Serif', serif" } as const;

export default function VelorahHero() {
  return (
    <div className="velorah-root relative min-h-screen w-full overflow-hidden bg-[hsl(var(--velorah-background))]">
      {/* Fullscreen looping background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Navigation Bar */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl flex-row items-center justify-between px-8 py-6">
          <a
            href="#"
            className="text-foreground text-3xl tracking-tight"
            style={displayFont}
          >
            Velorah<sup className="text-xs">®</sup>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className={
                    link === "Home"
                      ? "text-foreground text-sm"
                      : "text-muted-foreground text-sm transition-colors hover:text-foreground"
                  }
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>

          <Button className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground transition-transform hover:scale-[1.03]">
            Begin Journey
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pb-40 pt-32 text-center md:py-[90px] md:pt-32 md:pb-40">
        <h1
          className="animate-fade-rise max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-foreground sm:text-7xl md:text-8xl"
          style={displayFont}
        >
          Where <em className="not-italic text-muted-foreground">dreams</em>{" "}
          rise <em className="not-italic text-muted-foreground">through the silence.</em>
        </h1>

        <p className="animate-fade-rise-delay mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We&apos;re designing tools for deep thinkers, bold creators, and quiet
          rebels. Amid the chaos, we build digital spaces for sharp focus and
          inspired work.
        </p>

        <Button className="animate-fade-rise-delay-2 liquid-glass mt-12 cursor-pointer rounded-full px-14 py-5 text-base text-foreground transition-transform hover:scale-[1.03]">
          Begin Journey
        </Button>
      </main>
    </div>
  );
}
