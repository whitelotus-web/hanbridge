// SAMPLE testimonial data — replace with real reviews later.
export type Testimonial = {
  name: string;
  level: string;
  score: number;
  text: string;
  sample: true;
};

export const testimonials: Testimonial[] = [
  { name: "Nadine", level: "HSK4", score: 273, text: "HanBridge made learning Chinese so much easier. Grammar, reading and writing finally clicked for me.", sample: true },
  { name: "Kalgora", level: "HSK5", score: 275, text: "Thanks to HanBridge I passed HSK 5 smoothly!", sample: true },
  { name: "Minh Anh", level: "HSK5", score: 274, text: "I passed HSK level 5 using HanBridge. It really helped me!", sample: true },
  { name: "Kawalin", level: "HSK4", score: 292, text: "Passed HSK 4 with HanBridge. Totally recommend it, super useful!", sample: true },
  { name: "Hong Lan", level: "HSK5", score: 287, text: "Very practical — I can drill vocab, do listening & reading, and take mock exams.", sample: true },
  { name: "Eriko", level: "HSK2", score: 172, text: "HanBridge helped me pass HSK 1 and HSK 2 without buying extra workbooks.", sample: true },
  { name: "Sanele", level: "HSK3", score: 292, text: "Passed HSK 3 thanks to HanBridge. It really helped.", sample: true },
  { name: "Edyta", level: "HSK3", score: 298, text: "I did every past and mock test in the app — the real exam felt familiar. Strongly recommend!", sample: true }
];
