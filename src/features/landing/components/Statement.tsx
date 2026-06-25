export default function Statement() {
  return (
    <section id="statement" className="relative h-[230vh]">
      <div className="statement-pin sticky top-0 flex h-screen flex-col items-center justify-center px-[clamp(20px,5vw,72px)] text-center">
        <div className="wrap reveal">
          {/* decorative vertical rule */}
          <div
            className="rule mx-auto mb-[30px] h-[42px] w-px"
            style={{ background: "linear-gradient(#67e8f9, transparent)" }}
          />

          <h2 className="rv mx-auto max-w-[17ch] text-balance text-[clamp(30px,4.8vw,62px)] font-bold leading-[1.08] tracking-[-0.035em]">
            <span
              className="rv-w opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              We
            </span>{" "}
            <span
              className="rv-w opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              turn
            </span>{" "}
            <em
              className="rv-w not-italic [background:var(--grad)] bg-clip-text text-transparent opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              idle
            </em>{" "}
            <em
              className="rv-w not-italic [background:var(--grad)] bg-clip-text text-transparent opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              stablecoins
            </em>{" "}
            <span
              className="rv-w opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              into
            </span>{" "}
            <em
              className="rv-w not-italic [background:var(--grad)] bg-clip-text text-transparent opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              compounding
            </em>{" "}
            <em
              className="rv-w not-italic [background:var(--grad)] bg-clip-text text-transparent opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              yield,
            </em>{" "}
            <span
              className="rv-w opacity-[0.14] motion-reduce:opacity-100 transition-opacity duration-[400ms] ease-linear data-[lit=true]:opacity-100"
              data-lit="false"
            >
              automatically.
            </span>
          </h2>

          <p className="body mx-auto mt-8 max-w-[660px] text-[clamp(16px,1.7vw,19px)] leading-[1.62] text-muted-foreground">
            No spreadsheets, no protocol-hopping, no watching charts at 3am. You set the risk; the
            engine rebalances every ten minutes on rails that settle in five seconds for a
            fraction of a cent.
          </p>
        </div>
      </div>
    </section>
  );
}
