import { plugin } from "bun";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const resolveAsset = createRequire(new URL("../src/vendor/reactive-resume/pdf/hooks/use-register-fonts.ts", import.meta.url));

plugin({
  name: "local-pdf-assets",
  setup(build) {
    build.onLoad({ filter: /\?(url|raw)$/ }, ({ path }) => {
      const [asset, query] = path.split("?");
      const resolved = resolveAsset.resolve(asset);
      const value = query === "raw" ? readFileSync(resolved, "utf8") : resolved;
      return { contents: `export default ${JSON.stringify(value)}`, loader: "js" };
    });
  },
});
