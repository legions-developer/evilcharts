import assert from "node:assert/strict";
import { test } from "node:test";

import {
  escapeTooltipHtml,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
} from "@/registry/ui/echarts-tooltip";

test("row labels and formatted values cannot insert HTML elements", () => {
  const html = tooltipRow({
    indicatorHtml: "",
    labelText: '<img src=x onerror="alert(1)">',
    valueText: "</span><svg onload='alert(2)'>",
    dimmed: "",
  });

  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.match(html, /&lt;\/span&gt;&lt;svg onload=(?:&#39;|&#x27;)alert\(2\)(?:&#39;|&#x27;)&gt;/);
  assert.doesNotMatch(html, /<(?:img|svg)\b/i);
  assert.equal((html.match(/<\/span>/g) ?? []).length, 2);
});

test("the shell title cannot close its text container", () => {
  const html = tooltipShell({
    label: '</div><img src=x onerror="alert(1)">',
    body: "",
    roundness: "lg",
    variant: "default",
  });

  assert.ok(
    html.includes(
      '<div class="font-medium text-primary">&lt;/div&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</div>',
    ),
  );
  assert.doesNotMatch(html, /<img\b/i);
  assert.equal((html.match(/<\/div>/g) ?? []).length, 3);
});

test("class fragments cannot break out of the row's class attribute", () => {
  const html = tooltipRow({
    indicatorHtml: "",
    labelText: "Requests",
    valueText: "12",
    dimmed: ' opacity-30" onmouseover="alert(1)"><img src=x>',
  });

  const openingTag = html.match(/^<div class="([^"]*)">/);
  assert.ok(openingTag, "the row must have exactly one quoted class attribute");
  assert.ok(
    openingTag[1].includes(
      "opacity-30&quot; onmouseover=&quot;alert(1)&quot;&gt;&lt;img src=x&gt;",
    ),
  );
  assert.doesNotMatch(html, /<img\b/i);
});

for (const colorsCount of [1, 3]) {
  test(`${colorsCount}-color indicators cannot break out of the style attribute`, () => {
    const html = tooltipIndicatorHtml('sales" onmouseover="alert(1)"><img src=x>&\'', colorsCount);
    const element = html.match(/^<div class="[^"]*" style="([^"]*)"><\/div>$/);

    assert.ok(element, "the swatch must remain one div with a single quoted style attribute");
    assert.ok(
      element[1].includes("&quot; onmouseover=&quot;alert(1)&quot;&gt;&lt;img src=x&gt;&amp;"),
    );
    assert.doesNotMatch(element[1], /[<>]/);
    assert.match(element[1], /(?:&#39;|&#x27;)/);
    assert.ok(
      element[1].startsWith(colorsCount === 1 ? "background:var(" : "background:linear-gradient("),
    );
  });
}

test("ordinary text and Unicode survive HTML encoding", () => {
  const text = 'Revenue & costs < 10 > 5: "quoted", O\'Reilly — 東京 📈';
  const escaped = escapeTooltipHtml(text);

  assert.match(
    escaped,
    /^Revenue &amp; costs &lt; 10 &gt; 5: &quot;quoted&quot;, O(?:&#39;|&#x27;)Reilly — 東京 📈$/,
  );
  assert.equal(escapeTooltipHtml("Revenue — 東京 📈"), "Revenue — 東京 📈");
  assert.equal(escapeTooltipHtml(""), "");
});

test("entity-looking input remains literal text instead of becoming markup", () => {
  const html = tooltipRow({
    indicatorHtml: "",
    labelText: "&lt;img src=x onerror=alert(1)&gt;",
    valueText: "&#60;svg onload=alert(2)&#62; &quot;",
    dimmed: "",
  });

  assert.ok(html.includes("&amp;lt;img src=x onerror=alert(1)&amp;gt;"));
  assert.ok(html.includes("&amp;#60;svg onload=alert(2)&amp;#62; &amp;quot;"));
  assert.doesNotMatch(html, /<(?:img|svg)\b/i);
});

test("trusted indicator and body markup remain composable without double encoding", () => {
  const indicator = tooltipIndicatorHtml("revenue", 2);
  const row = tooltipRow({
    indicatorHtml: indicator,
    labelText: "Revenue & costs",
    valueText: "$1,250",
    dimmed: " opacity-30",
  });
  const html = tooltipShell({
    label: "October",
    body: row,
    roundness: "md",
    variant: "frosted-glass",
  });

  assert.ok(row.includes(indicator));
  assert.ok(html.includes(row));
  assert.ok(
    html.includes(
      'style="background:linear-gradient(to right, var(--color-revenue-0) 0%, var(--color-revenue-1) 100%)"',
    ),
  );
  assert.ok(html.includes("Revenue &amp; costs"));
  assert.doesNotMatch(html, /Revenue &amp;amp; costs|&lt;div\b/);
  assert.ok(html.includes('gap-2 opacity-30"'));
  assert.ok(html.includes("rounded-md bg-background/50 backdrop-blur-md"));
});
