import { getCollection } from "astro:content";
import { earnPerPlay, economy } from "@repo/config/economy";
import { perThousandPlays, slotOffer, usd } from "@repo/config/money";
import { project } from "@repo/config/project";
import type { APIRoute } from "astro";
import { FAQ_GROUPS } from "../lib/faq";
import { helpHref } from "../lib/help";
import { MARKETING_PAGES, isHidden } from "../lib/pages";

/**
 * The site in plain text, for AI answer engines (the llms.txt convention).
 * Every figure comes from `@repo/config/economy` and every answer from
 * `src/lib/faq.ts`, so what an engine quotes is what the pages say.
 */
export const GET: APIRoute = async () => {
  const site = project.siteUrl;
  const link = (path: string) => new URL(path, site).href;

  const help = (await getCollection("help"))
    .filter((topic) => !topic.data.draft)
    .sort((a, b) => a.data.order - b.data.order);
  const policies = MARKETING_PAGES.filter(
    (page) => !isHidden(page) && !["home", "blog", "help"].includes(page.slug),
  );

  const lines = [
    `# ${project.name}`,
    "",
    `> ${project.description}`,
    "",
    "## Key facts",
    "",
    `- Every approved screen earns ${perThousandPlays(earnPerPlay())}, the same rate on every screen. ${project.name} pays it, and no fee comes off it.`,
    `- An advertiser books a slot on the ring: ${slotOffer()}. The slot plays on every screen. There is no per-play bill.`,
    `- A screen is paid for up to ${economy.caps.dailyPlaysPerDevice.toLocaleString("en-US")} plays a day, and for up to ${economy.caps.paidHoursPerDay} hours a day.`,
    `- Earnings settle after ${economy.settlementDelayHours} hours. A payout starts from ${usd(economy.payout.minimum)}, after a ${economy.payout.holdDays}-day hold.`,
    "- The wallet holds US dollars. CapyTV, the screen app, runs in a web browser, with no camera and no microphone.",
    "- A person reviews every listing and every screen before it goes live.",
    "",
    "## Help",
    "",
    ...help.map(
      (topic) => `- [${topic.data.title}](${link(helpHref(topic.id))}): ${topic.data.description}`,
    ),
    "",
    "## Policies",
    "",
    ...policies.map(
      (page) =>
        `- [${page.title.replace(` | ${project.name}`, "")}](${link(page.path)}): ${page.description}`,
    ),
    "",
    ...FAQ_GROUPS.flatMap((group) => [
      `## FAQ: ${group.title}`,
      "",
      ...group.items.flatMap((item) => [`### ${item.question}`, "", item.answer, ""]),
    ]),
    "## Contact",
    "",
    `- Support: ${project.email.support}`,
    `- Site: ${site}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
