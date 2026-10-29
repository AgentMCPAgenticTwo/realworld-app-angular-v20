def short: tostring | gsub("\\s+"; " ") | .[0:180];
if .type == "assistant" then
  (.message.content[]? |
    if .type == "tool_use" then
      "▸ \(.name) \((.input.file_path // .input.command // .input.pattern // .input.url // .input.path // "") | short)"
    elif .type == "text" and ((.text // "") | length) > 0 then
      "· \(.text | short)"
    else empty end)
elif .type == "result" then
  "■ \(.subtype // "done") after \(.num_turns // 0) turns, \(((.duration_ms // 0) / 6000 | floor) / 10) min, $\(.total_cost_usd // 0)"
elif .type == "system" and .subtype == "init" then
  "● session \(.session_id // "?") · model \(.model // "?")"
else empty end
