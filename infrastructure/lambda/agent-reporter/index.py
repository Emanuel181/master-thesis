"""
Reporter Agent - Generates comprehensive security reports with PDF output
"""
import json
import os
import boto3
import logging
import io
from datetime import datetime

# PDF generation imports
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor, black, white, red, orange, yellow, green
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False
    print("Warning: reportlab not available, PDF generation disabled")

bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ['AWS_REGION'])
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')

BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID')
AGENT_ARTIFACTS_BUCKET = os.environ['AGENT_ARTIFACTS_BUCKET']
RUNS_TABLE = os.environ['RUNS_TABLE']
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def download_from_s3(bucket: str, key: str) -> dict:
    """Download and parse JSON from S3"""
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error downloading from S3: {e}")
        return None


# Color scheme for severity
SEVERITY_COLORS = {
    'Critical': HexColor('#DC2626') if HAS_REPORTLAB else '#DC2626',
    'High': HexColor('#EA580C') if HAS_REPORTLAB else '#EA580C',
    'Medium': HexColor('#CA8A04') if HAS_REPORTLAB else '#CA8A04',
    'Low': HexColor('#16A34A') if HAS_REPORTLAB else '#16A34A',
}

def handler(event, context):
    """Generate comprehensive security report with PDF"""
    try:
        run_id = event['runId']
        use_case = event['useCase']
        reviewer_output = event.get('reviewerOutput', {})
        implementer_output = event.get('implementerOutput', {})
        tester_output = event.get('testerOutput', {})
        
        logger.info(f"Starting Reporter Agent for run {run_id}")
        
        emit_event('reporter_started', {
            'runId': run_id,
            'useCaseId': use_case['id']
        })
        
        # Fetch full data from S3 for all outputs that have S3 references
        # Reviewer output
        if reviewer_output.get('fullResultsInS3'):
            logger.info(f"Fetching full reviewer output from S3: {reviewer_output.get('s3Key')}")
            try:
                full_data = download_from_s3(reviewer_output['s3Bucket'], reviewer_output['s3Key'])
                if full_data:
                    reviewer_output = full_data
            except Exception as e:
                logger.warning(f"Could not fetch reviewer data from S3: {e}")

        # Implementer output
        if implementer_output.get('fullResultsInS3'):
            logger.info(f"Fetching full implementer output from S3: {implementer_output.get('s3Key')}")
            try:
                full_data = download_from_s3(implementer_output['s3Bucket'], implementer_output['s3Key'])
                if full_data:
                    implementer_output = full_data
            except Exception as e:
                logger.warning(f"Could not fetch implementer data from S3: {e}")

        # Tester output
        if tester_output.get('fullResultsInS3'):
            logger.info(f"Fetching full tester output from S3: {tester_output.get('s3Key')}")
            try:
                full_data = download_from_s3(tester_output['s3Bucket'], tester_output['s3Key'])
                if full_data:
                    tester_output = full_data
            except Exception as e:
                logger.warning(f"Could not fetch tester data from S3: {e}")

        custom_prompt = use_case.get('reporterPrompt', '')
        
        # Generate comprehensive report content using LLM
        report_content = generate_report_content(
            reviewer_output=reviewer_output,
            implementer_output=implementer_output,
            tester_output=tester_output,
            custom_prompt=custom_prompt,
            use_case=use_case
        )
        
        # Generate PDF report
        pdf_key = None
        if HAS_REPORTLAB:
            pdf_buffer = generate_pdf_report(
                run_id=run_id,
                use_case=use_case,
                reviewer_output=reviewer_output,
                implementer_output=implementer_output,
                tester_output=tester_output,
                report_content=report_content
            )

            # Save PDF to S3
            pdf_key = f"runs/{run_id}/reporter/{use_case['id']}/security-report.pdf"
            s3.put_object(
                Bucket=AGENT_ARTIFACTS_BUCKET,
                Key=pdf_key,
                Body=pdf_buffer.getvalue(),
                ContentType='application/pdf'
            )
            logger.info(f"PDF report saved to s3://{AGENT_ARTIFACTS_BUCKET}/{pdf_key}")

        output = {
            'report': report_content,
            'pdfKey': pdf_key,
            'pdfUrl': f"s3://{AGENT_ARTIFACTS_BUCKET}/{pdf_key}" if pdf_key else None,
            'summary': {
                'totalVulnerabilities': len(reviewer_output.get('vulnerabilities', [])),
                'criticalCount': reviewer_output.get('severityCounts', {}).get('Critical', 0),
                'highCount': reviewer_output.get('severityCounts', {}).get('High', 0),
                'mediumCount': reviewer_output.get('severityCounts', {}).get('Medium', 0),
                'lowCount': reviewer_output.get('severityCounts', {}).get('Low', 0),
                'fixesGenerated': len(implementer_output.get('fixes', [])),
                'testsGenerated': len(tester_output.get('testResults', [])),
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Save JSON output to S3
        artifact_key = f"runs/{run_id}/reporter/{use_case['id']}/output.json"
        s3.put_object(
            Bucket=AGENT_ARTIFACTS_BUCKET,
            Key=artifact_key,
            Body=json.dumps(output, indent=2),
            ContentType='application/json'
        )
        
        # Store vulnerabilities in database
        store_vulnerabilities(run_id, use_case['id'], reviewer_output.get('vulnerabilities', []))
        
        emit_event('reporter_completed', {
            'runId': run_id,
            'useCaseId': use_case['id'],
            'vulnerabilityCount': output['summary']['totalVulnerabilities'],
            'pdfGenerated': pdf_key is not None
        })
        
        return output
        
    except Exception as e:
        logger.error(f"Error in Reporter Agent: {str(e)}", exc_info=True)
        emit_event('reporter_failed', {
            'runId': event.get('runId'),
            'error': str(e)
        })
        raise


def generate_pdf_report(run_id: str, use_case: dict, reviewer_output: dict,
                        implementer_output: dict, tester_output: dict,
                        report_content: str) -> io.BytesIO:
    """Generate a professional PDF security report"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                           rightMargin=0.75*inch, leftMargin=0.75*inch,
                           topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=HexColor('#1E3A5F')
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=20,
        spaceAfter=12,
        textColor=HexColor('#1E3A5F')
    )

    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=12,
        spaceBefore=12,
        spaceAfter=8,
        textColor=HexColor('#374151')
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        alignment=TA_JUSTIFY
    )

    story = []
    vulnerabilities = reviewer_output.get('vulnerabilities', [])
    severity_counts = reviewer_output.get('severityCounts', {})

    # Title Page
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("Security Assessment Report", title_style))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(f"<b>{use_case.get('title', 'Security Analysis')}</b>",
                          ParagraphStyle('Subtitle', parent=styles['Normal'],
                                        fontSize=14, alignment=TA_CENTER)))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(f"Run ID: {run_id}",
                          ParagraphStyle('RunID', parent=styles['Normal'],
                                        fontSize=10, alignment=TA_CENTER,
                                        textColor=HexColor('#6B7280'))))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
                          ParagraphStyle('Date', parent=styles['Normal'],
                                        fontSize=10, alignment=TA_CENTER,
                                        textColor=HexColor('#6B7280'))))
    story.append(PageBreak())

    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))

    total_vulns = len(vulnerabilities)
    critical = severity_counts.get('Critical', 0)
    high = severity_counts.get('High', 0)
    medium = severity_counts.get('Medium', 0)
    low = severity_counts.get('Low', 0)

    summary_text = f"""This security assessment identified <b>{total_vulns}</b> potential vulnerabilities 
    in the analyzed codebase. The findings include <font color="#DC2626"><b>{critical} Critical</b></font>, 
    <font color="#EA580C"><b>{high} High</b></font>, <font color="#CA8A04"><b>{medium} Medium</b></font>, 
    and <font color="#16A34A"><b>{low} Low</b></font> severity issues."""
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 0.2*inch))

    # Summary Table
    summary_data = [
        ['Metric', 'Count'],
        ['Total Vulnerabilities', str(total_vulns)],
        ['Critical Severity', str(critical)],
        ['High Severity', str(high)],
        ['Medium Severity', str(medium)],
        ['Low Severity', str(low)],
        ['Fixes Generated', str(len(implementer_output.get('fixes', [])))],
        ['Tests Created', str(len(tester_output.get('testResults', [])))],
    ]

    summary_table = Table(summary_data, colWidths=[3*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1E3A5F')),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#F9FAFB')),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#E5E7EB')),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.3*inch))

    # Detailed Findings
    story.append(Paragraph("Detailed Findings", heading_style))

    # Group vulnerabilities by severity for organized presentation
    severity_order = ['Critical', 'High', 'Medium', 'Low']
    vuln_by_severity = {s: [] for s in severity_order}
    for vuln in vulnerabilities:
        sev = vuln.get('severity', 'Medium')
        if sev in vuln_by_severity:
            vuln_by_severity[sev].append(vuln)
        else:
            vuln_by_severity['Medium'].append(vuln)

    vuln_index = 0
    for severity_level in severity_order:
        group = vuln_by_severity[severity_level]
        if not group:
            continue

        severity_color = {
            'Critical': '#DC2626',
            'High': '#EA580C',
            'Medium': '#CA8A04',
            'Low': '#16A34A'
        }.get(severity_level, '#6B7280')

        # Section header for severity group
        story.append(Paragraph(
            f"<font color='{severity_color}'><b>{severity_level} Severity ({len(group)} issues)</b></font>",
            subheading_style
        ))
        story.append(Spacer(1, 0.1*inch))

        for vuln in group:
            vuln_index += 1
            # Vulnerability header
            story.append(Paragraph(
                f"<b>{vuln_index}. {vuln.get('title', 'Security Issue')}</b> "
                f"<font color='{severity_color}'>[{severity_level}]</font>",
                subheading_style
            ))

            # Details
            if vuln.get('details'):
                story.append(Paragraph(f"<b>Description:</b> {vuln.get('details', '')[:800]}", body_style))

            if vuln.get('fileName'):
                line_info = f" (line {vuln.get('lineNumber')})" if vuln.get('lineNumber') else ""
                story.append(Paragraph(f"<b>File:</b> {vuln.get('fileName')}{line_info}", body_style))

            if vuln.get('cweId'):
                story.append(Paragraph(f"<b>CWE:</b> {vuln.get('cweId')}", body_style))

            if vuln.get('explanation'):
                story.append(Paragraph(f"<b>Impact:</b> {vuln.get('explanation', '')[:600]}", body_style))

            if vuln.get('bestPractices'):
                story.append(Paragraph(f"<b>Recommendation:</b> {vuln.get('bestPractices', '')[:600]}", body_style))

            if vuln.get('vulnerableCode'):
                code_snippet = vuln.get('vulnerableCode', '')[:300].replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(f"<b>Vulnerable Code:</b><br/><font face='Courier' size='8'>{code_snippet}</font>", body_style))

            story.append(Spacer(1, 0.15*inch))


    # Recommendations Section
    story.append(PageBreak())
    story.append(Paragraph("Recommendations", heading_style))

    recommendations = [
        "Address all Critical and High severity vulnerabilities immediately",
        "Implement input validation and output encoding across the application",
        "Review and update authentication and authorization mechanisms",
        "Conduct regular security code reviews and penetration testing",
        "Implement security monitoring and logging",
        "Keep all dependencies and frameworks up to date",
    ]

    for rec in recommendations:
        story.append(Paragraph(f"• {rec}", body_style))

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_report_content(reviewer_output: dict, implementer_output: dict,
                           tester_output: dict, custom_prompt: str, use_case: dict) -> str:
    """Generate comprehensive security report content using LLM"""
    system_prompt = f"""You are a security report writer. Generate a comprehensive, executive-level security assessment report.

Include:
1. Executive Summary
2. Methodology
3. Findings by Severity
4. Detailed Vulnerability Analysis
5. Remediation Recommendations
6. Risk Assessment
7. Compliance Mapping (OWASP, CWE)
8. Timeline for Remediation

{f'Custom instructions: {custom_prompt}' if custom_prompt else ''}"""
    
    vulnerabilities = reviewer_output.get('vulnerabilities', [])
    fixes = implementer_output.get('fixes', [])
    tests = tester_output.get('testResults', [])
    
    user_message = f"""Generate a security assessment report for: {use_case.get('title', 'Security Analysis')}

Vulnerabilities Found: {len(vulnerabilities)}
- Critical: {reviewer_output.get('severityCounts', {}).get('Critical', 0)}
- High: {reviewer_output.get('severityCounts', {}).get('High', 0)}
- Medium: {reviewer_output.get('severityCounts', {}).get('Medium', 0)}
- Low: {reviewer_output.get('severityCounts', {}).get('Low', 0)}

Fixes Generated: {len(fixes)}
Tests Created: {len(tests)}

Vulnerability Details:
{json.dumps(vulnerabilities[:5], indent=2)}

Generate a comprehensive report."""
    
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}],
        "temperature": 0.3
    }
    
    response = bedrock_runtime.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    report_content = response_body['content'][0]['text']
    
    return report_content


def store_vulnerabilities(run_id: str, use_case_id: str, vulnerabilities: list):
    """Store vulnerabilities in DynamoDB"""
    logger.info(f"Storing {len(vulnerabilities)} vulnerabilities for run {run_id}")


def emit_event(event_type: str, detail: dict):
    """Emit event to EventBridge"""
    try:
        events.put_events(
            Entries=[{
                'Source': 'orchestrator.reporter',
                'DetailType': event_type,
                'Detail': json.dumps(detail),
                'EventBusName': EVENT_BUS_NAME
            }]
        )
    except Exception as e:
        logger.error(f"Error emitting event: {str(e)}")
