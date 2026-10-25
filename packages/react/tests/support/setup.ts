// Every browser test renders with the real stylesheet: the tokens, the base layer and each family's
// CSS straight from source, so a test sees exactly what an app sees.
import "@qeetrix/tokens/tokens.css";
import "../../src/styles/base.css";

import.meta.glob("../../src/*/*.css", { eager: true });
import.meta.glob("../../src/experimental/*/*.css", { eager: true });
