export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} — FootData Analytics` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — FootData Analytics` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
