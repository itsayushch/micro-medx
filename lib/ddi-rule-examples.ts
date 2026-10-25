export const DDI_REVIEW_DRUGS = [
  "Warfarin",
  "Aspirin",
  "Fluconazole",
  "Lacosamide",
  "Cenobamate",
  "Valproic acid",
] as const;

export type DdiReviewDrug = (typeof DDI_REVIEW_DRUGS)[number];
export type DdiReviewOutcome = "warning" | "study_no_signal";

export type DdiRuleExample = {
  drugs: readonly [DdiReviewDrug, DdiReviewDrug];
  outcome: DdiReviewOutcome;
  summary: string;
  context: string;
  source: string;
  url: string;
};

// These four source-reviewed examples are demonstrations, not a complete DDI checker.
export const DDI_RULE_EXAMPLES: readonly DdiRuleExample[] = [
  {
    drugs: ["Warfarin", "Aspirin"],
    outcome: "warning",
    summary: "FDA aspirin labeling warns that use with warfarin can increase bleeding risk and prolong prothrombin and bleeding times.",
    context: "This is a label-based warning, not an individualized risk estimate. Ask the prescriber whether an indication-appropriate alternative is available; do not stop or switch therapy based on this demo.",
    source: "FDA aspirin-containing product prescribing information",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/011702s041lbl.pdf",
  },
  {
    drugs: ["Warfarin", "Fluconazole"],
    outcome: "warning",
    summary: "FDA fluconazole labeling reports increased prothrombin time and bleeding events with concurrent warfarin use.",
    context: "This is a label-based warning, not an individualized risk estimate. Ask the prescriber whether an indication-appropriate alternative is available; do not stop or switch therapy based on this demo.",
    source: "FDA fluconazole prescribing information",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2019/019950s066,s067lbl.pdf",
  },
  {
    drugs: ["Warfarin", "Lacosamide"],
    outcome: "study_no_signal",
    summary: "An FDA-labeled study found no clinically relevant change in warfarin pharmacokinetic or pharmacodynamic effects when co-administered with lacosamide.",
    context: "The cited study used lacosamide 400 mg/day and a single 25 mg warfarin dose in healthy male subjects. This narrow study result does not establish that the combination is safe for every patient.",
    source: "FDA VIMPAT (lacosamide) prescribing information",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/022253s051%2C022254s041%2C022255s033lbl.pdf",
  },
  {
    drugs: ["Cenobamate", "Valproic acid"],
    outcome: "study_no_signal",
    summary: "FDA cenobamate labeling reports no clinically significant pharmacokinetic differences for valproic acid when used concomitantly.",
    context: "This is a study-specific pharmacokinetic result, not a complete safety assessment or a guarantee for an individual patient.",
    source: "FDA XCOPRI (cenobamate) prescribing information",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/212839s006s007lbl.pdf",
  },
];

function normalizedPair(drugA: string, drugB: string): string {
  return [drugA.toLocaleLowerCase(), drugB.toLocaleLowerCase()].sort().join("|");
}

export function findDdiRuleExample(drugA: string, drugB: string): DdiRuleExample | undefined {
  const pair = normalizedPair(drugA, drugB);
  return DDI_RULE_EXAMPLES.find((example) => normalizedPair(...example.drugs) === pair);
}

export function getDdiReviewPartners(drug: DdiReviewDrug): DdiReviewDrug[] {
  return DDI_RULE_EXAMPLES.flatMap(({ drugs }) => {
    if (drugs[0] === drug) return [drugs[1]];
    if (drugs[1] === drug) return [drugs[0]];
    return [];
  });
}
