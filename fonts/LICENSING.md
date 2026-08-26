# Font licensing

| File | Family | Foundry | License | Status |
|---|---|---|---|---|
| nunito-variable.woff2 | Nunito | Google (Vernon Adams et al.) | SIL OFL 1.1 | ✅ redistributable |
| nunito-italic-variable.woff2 | Nunito (italic) | Google | SIL OFL 1.1 | ✅ redistributable |
| nunito-sans-variable.woff2 | Nunito Sans | Google | SIL OFL 1.1 | ✅ redistributable |

## Brand face — "Ambit" (NOT shipped)

The live 1-800 Contacts site renders a licensed **"Ambit"-class** rounded
geometric sans (proprietary). It is **not** rehosted here (no embedding license
on hand). The font stacks keep `"Ambit"` first, so if the webfont is licensed
and added to `styles/fonts.css` later it wins automatically with zero code
change. Until then the shipped face is **Nunito / Nunito Sans** — the closest
open rounded match and the prototype's own documented fallback.

This is the same font-substitution residual recorded in the replica
source-fidelity gate (`stardust/replica/gates/`): text-edge antialiasing differs
from Ambit, but structural fidelity (metrics, wrapping, layout) is preserved.

**To drop Ambit in later:** add its `@font-face` (family `"Ambit"`) to
`styles/fonts.css` — nothing else changes.
