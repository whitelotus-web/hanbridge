// SAMPLE news data — replace with CMS-backed articles later.
export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  sample: true;
};

export const news: NewsItem[] = [
  { slug: "hsk-exam-dates", title: "HSK exam dates & registration guide", date: "2025-01-15", sample: true },
  { slug: "expand-vocabulary", title: "Effective ways to expand your Chinese vocabulary", date: "2025-02-06", sample: true },
  { slug: "self-study-chinese", title: "How to self-study Chinese: methods & resources", date: "2025-03-31", sample: true },
  { slug: "improve-listening", title: "Proven techniques to improve your listening skills", date: "2025-04-20", sample: true }
];
