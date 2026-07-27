// Self-lint: relative import, not the package alias, since this package
// is what @qa-mastery/config/eslint.base.mjs resolves to for everyone else.
import base from "./eslint.base.mjs";

export default base;
