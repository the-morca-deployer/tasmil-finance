interface Protocol {
  n: string;
  f: string;
  inv?: boolean;
}

const protocols: Protocol[] = [
  { n: "Blend", f: "/partners/blend.svg" },
  { n: "Soroswap", f: "/partners/soroswap.svg" },
  { n: "Aquarius", f: "/partners/aquarius.svg" },
  { n: "Phoenix", f: "/partners/phoenix.svg" },
  { n: "Allbridge", f: "/partners/allbridge.svg" },
  { n: "DeFindex", f: "/partners/defindex.svg" },
  { n: "Templar", f: "/partners/templar.svg" },
  { n: "SDEX", f: "/partners/sdex.svg", inv: true },
];

const row2data: Protocol[] = [...protocols.slice(4), ...protocols.slice(0, 4)];

function TkMark({ p }: { p: Protocol }) {
  return (
    <span className="flex items-center gap-[14px] px-[clamp(24px,3.4vw,48px)] whitespace-nowrap opacity-[0.85] transition-opacity duration-[400ms] hover:opacity-100">
      <img
        src={p.f}
        alt={p.n}
        className={`h-[46px] w-[46px] rounded-full object-contain block${p.inv ? " brightness-0 invert" : ""}`}
      />
      <span className="text-[clamp(17px,1.9vw,24px)] font-semibold tracking-[-0.02em] text-[#f4f7fb]">
        {p.n}
      </span>
    </span>
  );
}

export default function Partners() {
  const row1Items = [...protocols, ...protocols];
  const row2Items = [...row2data, ...row2data];

  return (
    <section id="partners" className="relative h-[230vh] p-0">
      <div className="sticky top-0 h-screen flex flex-col justify-center gap-[34px]">
        <div
          className="overline reveal ml-[clamp(20px,5vw,72px)] text-[14.5px] font-bold tracking-[0.2em] uppercase"
          style={{
            background: "linear-gradient(100deg, #a5f3fc 0%, #0ea5e9 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Integrated with
        </div>
        <div className="mt-[38px] relative overflow-hidden flex flex-col gap-[18px] [mask-image:linear-gradient(90deg,transparent,#000_9%,#000_91%,transparent)] [-webkit-mask-image:linear-gradient(90deg,transparent,#000_9%,#000_91%,transparent)]">
          {/* row 1 — forward drift */}
          <div id="ticker" className="flex w-max will-change-transform">
            {row1Items.map((p, i) => (
              <TkMark key={`r1-${p.n}-${i}`} p={p} />
            ))}
          </div>
          {/* row 2 — reverse drift */}
          <div id="ticker2" className="flex w-max will-change-transform">
            {row2Items.map((p, i) => (
              <TkMark key={`r2-${p.n}-${i}`} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
