import type { GuildFunction } from "../../../types";
import { GUILD_FUNCTION_CARDS } from "../../lib/guild-function-copy";

export function GuildFunctionCards({
  functions,
}: {
  functions: GuildFunction[];
}) {
  if (!functions.length) return null;

  return (
    <ul className="designer-detail-fn-list">
      {functions.map((fn) => {
        const card = GUILD_FUNCTION_CARDS[fn];
        if (!card) return null;
        return (
          <li key={fn} className="designer-detail-fn">
            <span className="designer-detail-fn-label">{card.label}</span>
            <p className="designer-detail-fn-desc">{card.description}</p>
          </li>
        );
      })}
    </ul>
  );
}
