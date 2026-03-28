/** Preset manager prompts — full text is sent to the insights API (not truncated in UI). */
export const MANAGER_INSIGHT_ACTIONS: ReadonlyArray<{ label: string; prompt: string }> = [
    {
        label: 'Weekly ops briefing',
        prompt:
            'Produce a complete Markdown briefing for PowerWorld Kiribathgoda: executive summary (2–4 sentences), **Priority actions** (5–7 specific bullets with timelines or owners where sensible), **Risks & anomalies** (only if data supports, else say none), and **Metrics to watch** (2–4 bullets). Use only facts from the data snapshot and RAG; do not invent numbers.',
    },
    {
        label: 'Revenue & forecast',
        prompt:
            'Analyze current monthly revenue and visit trends. In Markdown: short summary, then **Drivers**, **Risks to revenue**, and **Next steps** (5–7 actionable bullets). Ground every claim in the provided KPIs; note uncertainty explicitly.',
    },
    {
        label: 'Churn & retention',
        prompt:
            'Assess member engagement and churn risk from the KPI snapshot and trends. Return Markdown with summary, **Signals**, **Retention actions** (5–7 bullets with concrete steps), and **What to measure next**.',
    },
    {
        label: 'Staffing & peaks',
        prompt:
            'Recommend staffing and floor coverage using visit and incident data. Markdown: summary, **Peak windows**, **Coverage gaps**, and **Action plan** (5–7 bullets). Tie recommendations to the numbers provided.',
    },
    {
        label: 'Incidents & safety',
        prompt:
            'Focus on open issues and operational safety. Markdown: summary, **Incident priorities**, **Member experience impact**, and **Remediation steps** (5–7 bullets). Prioritize by severity implied by the data.',
    },
];
