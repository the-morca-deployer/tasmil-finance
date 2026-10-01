// @dicebear/core@10 is ESM-only and next/jest never transforms node_modules,
// so tests get a deterministic stand-in with the same Avatar/Style surface.
export class Style {
  constructor(readonly definition: unknown) {}
}

export class Avatar {
  private readonly seed: string;

  constructor(_style: unknown, options: { seed?: string } = {}) {
    this.seed = options.seed ?? "";
  }

  toString(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" data-seed="${this.seed}"></svg>`;
  }

  toDataUri(): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.toString())}`;
  }
}
