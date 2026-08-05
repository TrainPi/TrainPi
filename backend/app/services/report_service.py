"""
Server-side PDF generation for Exhibit A Step 4 (Results & Insights summary
report) and Step 5 (Roadmap PDF). Pure-Python via xhtml2pdf — no native/OS
dependencies, works identically on Windows dev and Vercel's Linux serverless.
"""
import io
from datetime import datetime
from xhtml2pdf import pisa

from app.models import WorkforceAnalysis, WorkforceRoadmap, WorkforceProfile


def _escape(text) -> str:
    if text is None:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _base_styles() -> str:
    return """
    <style>
        @page { size: letter; margin: 2cm; }
        body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; font-size: 11pt; }
        h1 { color: #4f46e5; font-size: 22pt; margin-bottom: 4px; }
        h2 { color: #4f46e5; font-size: 14pt; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .subtitle { color: #64748b; font-size: 10pt; margin-bottom: 16px; }
        .score-box { background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
        .score-value { font-size: 32pt; color: #4f46e5; font-weight: bold; }
        .label { color: #64748b; font-size: 9pt; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background-color: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 9pt; color: #64748b; text-transform: uppercase; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
        ul { margin: 4px 0; padding-left: 18px; }
        li { margin-bottom: 4px; }
        .phase { background-color: #f8fafc; border-left: 3px solid #6366f1; padding: 8px 12px; margin-bottom: 12px; }
        .phase-title { font-weight: bold; color: #4f46e5; }
        .footer { color: #94a3b8; font-size: 8pt; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
    """


def build_analysis_report_html(analysis: WorkforceAnalysis, profile: WorkforceProfile | None) -> str:
    generated = datetime.utcnow().strftime("%B %d, %Y")
    name_line = f"for {_escape(profile.current_job_title)}" if profile and profile.current_job_title else ""

    comparison_rows = ""
    for row in (analysis.comparison_table or []):
        comparison_rows += f"""
        <tr>
            <td>{_escape(row.get('area'))}</td>
            <td>{_escape(row.get('participant'))}</td>
            <td>{_escape(row.get('agency_requirement'))}</td>
            <td>{_escape(row.get('result'))}</td>
        </tr>"""

    strengths_html = "".join(f"<li>{_escape(s)}</li>" for s in (analysis.top_strengths or []))
    gaps_html = "".join(f"<li>{_escape(g)}</li>" for g in (analysis.top_gaps or []))
    insights_html = "".join(f"<li>{_escape(i)}</li>" for i in (analysis.key_insights or []))

    gap_summary = analysis.gap_summary or {}

    return f"""
    <html>
    <head>{_base_styles()}</head>
    <body>
        <h1>TrainPi Workforce Readiness Report</h1>
        <p class="subtitle">Generated {generated} {name_line}</p>

        <div class="score-box">
            <span class="label">Overall Readiness Score</span><br/>
            <span class="score-value">{analysis.overall_score:.0f}%</span>
            &nbsp; <strong>{_escape(analysis.readiness_label)}</strong>
            <p>{_escape(analysis.summary)}</p>
        </div>

        <h2>Operational Readiness Scoring</h2>
        <table>
            <tr><th>Category</th><th>Score</th></tr>
            <tr><td>Technical Skills</td><td>{analysis.technical_skills_score:.0f}%</td></tr>
            <tr><td>Experience Alignment</td><td>{analysis.experience_alignment_score:.0f}%</td></tr>
            <tr><td>Workflow Readiness</td><td>{analysis.workflow_readiness_score:.0f}%</td></tr>
            <tr><td>Mission Alignment</td><td>{analysis.mission_alignment_score:.0f}%</td></tr>
            <tr><td>Compliance Readiness</td><td>{analysis.compliance_readiness_score:.0f}%</td></tr>
        </table>

        <h2>Top Strengths</h2>
        <ul>{strengths_html or '<li>None identified</li>'}</ul>

        <h2>Top Gaps</h2>
        <ul>{gaps_html or '<li>None identified</li>'}</ul>

        <h2>Gap Summary</h2>
        <table>
            <tr><th>Major</th><th>Moderate</th><th>Minor</th></tr>
            <tr><td>{gap_summary.get('major', 0)}</td><td>{gap_summary.get('moderate', 0)}</td><td>{gap_summary.get('minor', 0)}</td></tr>
        </table>

        <h2>Detailed Comparison</h2>
        <table>
            <tr><th>Area</th><th>Participant</th><th>Agency Requirement</th><th>Result</th></tr>
            {comparison_rows}
        </table>

        <h2>Key Insights</h2>
        <ul>{insights_html or '<li>None identified</li>'}</ul>

        <p class="footer">TrainPi — AI-Guided Operational Workforce Readiness Platform. This report is confidential and generated for the participant's individual use.</p>
    </body>
    </html>
    """


def build_roadmap_report_html(roadmap: WorkforceRoadmap, analysis: WorkforceAnalysis | None) -> str:
    generated = datetime.utcnow().strftime("%B %d, %Y")
    score_line = ""
    if analysis:
        score_line = f"<p>Current readiness: <strong>{analysis.overall_score:.0f}% — {_escape(analysis.readiness_label)}</strong></p>"

    phases_html = ""
    for phase in (roadmap.phases or []):
        items_html = "".join(f"<li>{_escape(item)}</li>" for item in phase.get("items", []))
        phases_html += f"""
        <div class="phase">
            <span class="phase-title">Phase {phase.get('number')}: {_escape(phase.get('label'))}</span>
            <span class="label"> ({_escape(phase.get('duration'))})</span>
            <ul>{items_html}</ul>
        </div>"""

    priorities_html = "".join(f"<li>{_escape(p)}</li>" for p in (roadmap.top_priorities or []))
    next_steps_html = "".join(f"<li>{_escape(s)}</li>" for s in (roadmap.next_steps or []))

    return f"""
    <html>
    <head>{_base_styles()}</head>
    <body>
        <h1>TrainPi Personalized Roadmap</h1>
        <p class="subtitle">Generated {generated}</p>
        {score_line}

        <h2>Roadmap Overview</h2>
        <table>
            <tr><th>Recommended Skills</th><th>Learning Modules</th><th>Key Projects</th><th>Days to Complete</th></tr>
            <tr>
                <td>{roadmap.recommended_skills_count}</td>
                <td>{roadmap.learning_modules_count}</td>
                <td>{roadmap.key_projects_count}</td>
                <td>{_escape(roadmap.days_to_complete)}</td>
            </tr>
        </table>

        <h2>Your Roadmap</h2>
        {phases_html}

        <h2>Top Priorities</h2>
        <ul>{priorities_html or '<li>None identified</li>'}</ul>

        <h2>Next Steps</h2>
        <ul>{next_steps_html or '<li>None identified</li>'}</ul>

        <p class="footer">TrainPi — AI-Guided Operational Workforce Readiness Platform. This roadmap is personalized and generated for the participant's individual use.</p>
    </body>
    </html>
    """


def build_organization_summary_report_html(summary) -> str:
    """summary is a schemas.OrganizationReadinessSummary (or matching dict) —
    the same aggregate data the /admin readiness-summary endpoint returns.
    Exhibit A's 'downloadable reports' requirement at the org level, alongside
    the per-participant reports built above."""
    generated = datetime.utcnow().strftime("%B %d, %Y")

    avg_score = summary.average_readiness_score
    avg_score_display = f"{avg_score:.0f}%" if avg_score is not None else "—"

    distribution_rows = "".join(
        f"<tr><td>{_escape(label)}</td><td>{count}</td></tr>"
        for label, count in (summary.readiness_distribution or {}).items()
    )

    gaps_rows = "".join(
        f"<tr><td>{_escape(g.get('gap'))}</td><td>{g.get('count')}</td></tr>"
        for g in (summary.most_common_gaps or [])
    )

    participant_rows = ""
    for p in (summary.participants or []):
        score_display = f"{p.overall_score:.0f}%" if p.overall_score is not None else "No analysis yet"
        gaps_display = ", ".join((p.top_gaps or [])[:3]) or "—"
        participant_rows += f"""
        <tr>
            <td>{_escape(p.full_name or p.email)}</td>
            <td>{_escape(p.role)}</td>
            <td>{_escape(p.readiness_label) if p.readiness_label else score_display}</td>
            <td>{_escape(gaps_display)}</td>
        </tr>"""

    return f"""
    <html>
    <head>{_base_styles()}</head>
    <body>
        <h1>TrainPi Organizational Readiness Report</h1>
        <p class="subtitle">{_escape(summary.organization_name)} — Generated {generated}</p>

        <div class="score-box">
            <span class="label">Average Readiness Score</span><br/>
            <span class="score-value">{avg_score_display}</span>
            <p>{summary.participants_with_analysis} of {summary.total_participants} participant(s) have completed an analysis.</p>
        </div>

        <h2>Readiness Distribution</h2>
        <table>
            <tr><th>Readiness Level</th><th>Participants</th></tr>
            {distribution_rows or '<tr><td colspan="2">No completed analyses yet</td></tr>'}
        </table>

        <h2>Most Common Gaps Across Organization</h2>
        <table>
            <tr><th>Gap</th><th>Participants Affected</th></tr>
            {gaps_rows or '<tr><td colspan="2">No gaps identified yet</td></tr>'}
        </table>

        <h2>Participants</h2>
        <table>
            <tr><th>Name</th><th>Role</th><th>Readiness</th><th>Top Gaps</th></tr>
            {participant_rows or '<tr><td colspan="4">No participants yet</td></tr>'}
        </table>

        <p class="footer">TrainPi — AI-Guided Operational Workforce Readiness Platform. This report aggregates workforce readiness across all participants in this organization and is intended for organizational administrators only.</p>
    </body>
    </html>
    """


def html_to_pdf_bytes(html: str) -> bytes:
    buffer = io.BytesIO()
    result = pisa.CreatePDF(html, dest=buffer)
    if result.err:
        raise RuntimeError("PDF generation failed")
    return buffer.getvalue()
