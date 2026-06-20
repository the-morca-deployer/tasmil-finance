import Image from "next/image";

const PROTOCOLS = [
  {
    id: "tasmil",
    label: "Tasmil Vault",
    src: "/protocols/tasmil.png",
    href: "#",
  },
  {
    id: "soroswap",
    label: "Soroswap",
    src: "/protocols/soroswap.svg",
    href: "https://soroswap.finance",
  },
  {
    id: "blend",
    label: "Blend",
    src: "/protocols/blend.svg",
    href: "https://www.blend.capital",
  },
  {
    id: "aquarius",
    label: "Aquarius",
    src: "/protocols/aquarius.svg",
    href: "https://aqua.network",
  },
  {
    id: "phoenix",
    label: "Phoenix",
    src: "/protocols/phoenix.svg",
    href: "#",
  },
  {
    id: "defindex",
    label: "DeFindex",
    src: "/protocols/defindex.svg",
    href: "#",
  },
] as const;

export function ProtocolStack() {
  return (
    <div className="flex flex-wrap gap-2">
      {PROTOCOLS.map((p) => (
        <a
          key={p.id}
          href={p.href}
          target={p.href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="relative grid place-items-center w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:border-sponsor-accent-line transition"
          aria-label={p.label}
        >
          <Image src={p.src} alt={p.label} width={20} height={20} />
        </a>
      ))}
    </div>
  );
}
