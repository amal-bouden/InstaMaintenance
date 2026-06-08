from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Flowable
from reportlab.graphics.shapes import Drawing, Rect, String
from datetime import datetime

class RotatedText(Flowable):
    def __init__(self, text, style, angle=90):
        super().__init__()
        self.text = text
        self.style = style
        self.angle = angle
        self.p = Paragraph(text, style)

    def wrap(self, availWidth, availHeight):
        from reportlab.pdfbase.pdfmetrics import stringWidth
        self.p_w = stringWidth(self.text, self.style.fontName, self.style.fontSize)
        self.p_h = self.style.leading if self.style.leading else self.style.fontSize * 1.2
        return self.p_h, self.p_w

    def draw(self):
        self.canv.saveState()
        self.p.wrap(self.p_w, self.p_h)
        if self.angle == 90:
            self.canv.translate(self.p_h, 0)
            self.canv.rotate(90)
            self.p.drawOn(self.canv, 0, 0)
        elif self.angle == 270:
            self.canv.translate(0, self.p_w)
            self.canv.rotate(270)
            self.p.drawOn(self.canv, 0, 0)
        self.canv.restoreState()

def format_dt(dt):
    if not dt:
        return "—"
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except:
            return dt
    return dt.strftime("%d/%m/%Y %H:%M")

def generate_fiche_pdf(intervention, machine) -> bytes:
    import io
    buffer = io.BytesIO()
    
    # Page template with narrow margins to match physical form
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.8*cm,
        leftMargin=0.8*cm,
        topMargin=0.8*cm,
        bottomMargin=0.8*cm
    )

    styles = getSampleStyleSheet()
    
    style_center_bold = ParagraphStyle(
        "CenterBold",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        alignment=1 # Center
    )

    style_center_small = ParagraphStyle(
        "CenterSmall",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        alignment=1 # Center
    )

    style_label_val = ParagraphStyle(
        "LabelVal",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10.5,
    )
    
    style_rotated = ParagraphStyle(
        "Rotated",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=1 # Center
    )

    story = []
    
    # 1. Logo tensa
    logo_drawing = Drawing(80, 35)
    logo_drawing.add(Rect(5, 2, 70, 30, rx=13, ry=13, fillColor=None, strokeColor=colors.black, strokeWidth=1))
    logo_drawing.add(String(40, 11, "tensa", fontName="Helvetica-Bold", fontSize=15, textAnchor='middle', fillColor=colors.black))

    # Header Row Table
    header_data = [
        [
            logo_drawing,
            Paragraph("Formulaire/Form<br/><b>Fiche d'intervention maintenance corrective</b><br/><i>Intervention sheet corrective maintenance</i>", style_center_bold),
            Paragraph("<b>FOR-MAI-03</b><br/>Version 00<br/>Page 1/1<br/>18/05/2022", style_center_small)
        ]
    ]
    header_table = Table(header_data, colWidths=[3.5*cm, 11.5*cm, 4.0*cm])
    header_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(header_table)

    # Reusable borders helper to avoid double-borders
    def get_no_top_border_style():
        return [
            ('LINELEFT', (0,0), (0,-1), 1, colors.black),
            ('LINERIGHT', (-1,0), (-1,-1), 1, colors.black),
            ('LINEBELOW', (0,0), (-1,-1), 1, colors.black),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]

    # 2. Section & Machine Table
    sec_mach_data = [
        [
            Paragraph(f"<b>Section:</b> &nbsp; {machine.section}", style_label_val),
            Paragraph(f"<b>Machine:</b> &nbsp; {machine.code}", style_label_val)
        ]
    ]
    sec_mach_table = Table(sec_mach_data, colWidths=[9.5*cm, 9.5*cm])
    sec_mach_table.setStyle(TableStyle(get_no_top_border_style()))
    story.append(sec_mach_table)

    # 3. Dates Table
    dates_data = [
        [
            Paragraph(f"<font size='6'>Heure et date de la réclamation / Claim's time and date</font><br/><b>{format_dt(intervention.heure_reclamation)}</b>", style_label_val),
            Paragraph(f"<font size='6'>Heure et date de l'intervention / Intervention's time and date</font><br/><b>{format_dt(intervention.heure_debut)}</b>", style_label_val),
            Paragraph(f"<font size='6'>Heure et date de fin de l'intervention / End time and date</font><br/><b>{format_dt(intervention.heure_fin)}</b>", style_label_val),
        ]
    ]
    dates_table = Table(dates_data, colWidths=[6.33*cm, 6.33*cm, 6.34*cm])
    dates_table.setStyle(TableStyle(get_no_top_border_style()))
    story.append(dates_table)

    # 4. Applicant & Recipient Names Table
    names_data = [
        [
            Paragraph(f"<font size='6'>Nom et signature du demandeur / Name and signature of the applicant</font><br/><b>{intervention.nom_demandeur or '—'}</b><br/><br/><br/>", style_label_val),
            Paragraph(f"<font size='6'>Nom et signature du réceptionnaire / Name and signature of the recipient</font><br/><b>{intervention.nom_receptionnaire or '—'}</b><br/><br/><br/>", style_label_val),
        ]
    ]
    names_table = Table(names_data, colWidths=[9.5*cm, 9.5*cm])
    names_table.setStyle(TableStyle(get_no_top_border_style()))
    story.append(names_table)

    # 5. Demandeur Vertical block (Anomaly description)
    anomaly_desc = intervention.description.replace('\n', '<br/>') if intervention.description else "—"
    demandeur_data = [
        [
            RotatedText("Demandeur / Applicant", style_rotated),
            Paragraph(f"<b>Description de l'anomalie / Description of the anomaly</b><br/><br/>{anomaly_desc}", style_label_val)
        ]
    ]
    demandeur_table = Table(demandeur_data, colWidths=[0.8*cm, 18.2*cm])
    demandeur_table_style = get_no_top_border_style()
    # Align the vertical rotated text cell in the middle
    demandeur_table_style.append(('VALIGN', (0,0), (0,0), 'MIDDLE'))
    demandeur_table_style.append(('ALIGN', (0,0), (0,0), 'CENTER'))
    demandeur_table_style.append(('LEFTPADDING', (0,0), (0,0), 0))
    demandeur_table_style.append(('RIGHTPADDING', (0,0), (0,0), 0))
    demandeur_table.setStyle(TableStyle(demandeur_table_style))
    story.append(demandeur_table)

    # 6. Diagnostic Vertical block (Breakdown nature, settings, findings)
    nature_electrique_box = "<b>[X]</b>" if intervention.nature_electrique else "[ &nbsp; ]"
    nature_mecanique_box = "<b>[X]</b>" if intervention.nature_mecanique else "[ &nbsp; ]"
    nature_autre_box = "<b>[X]</b>" if intervention.nature_autre else "[ &nbsp; ]"
    
    nature_str = (
        f"<b>Nature de la panne / Nature of the breakdown</b> &nbsp; &nbsp; &nbsp; &nbsp; "
        f"Electrique / electric &nbsp; {nature_electrique_box} &nbsp; &nbsp; &nbsp; &nbsp; "
        f"Mécanique / mechanical &nbsp; {nature_mecanique_box} &nbsp; &nbsp; &nbsp; &nbsp; "
        f"Autre / other &nbsp; {nature_autre_box}"
    )
    
    diagnostic_data = [
        [
            RotatedText("Diagnostic / Diagnosis", style_rotated),
            Paragraph(nature_str, style_label_val)
        ],
        [
            "",
            Paragraph(f"<b>Paramètres contrôlés / Controlled settings</b><br/>{intervention.parametres_controles or '—'}", style_label_val)
        ],
        [
            "",
            Paragraph(f"<b>Remarques et constats / Notes and findings</b><br/>{intervention.remarques or '—'}", style_label_val)
        ]
    ]
    diagnostic_table = Table(diagnostic_data, colWidths=[0.8*cm, 18.2*cm])
    diagnostic_table_style = [
        ('SPAN', (0,0), (0,2)),
        ('LINELEFT', (0,0), (0,-1), 1, colors.black),
        ('LINERIGHT', (-1,0), (-1,-1), 1, colors.black),
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.black),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('VALIGN', (0,0), (0,2), 'MIDDLE'),
        ('ALIGN', (0,0), (0,2), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (1,0), (-1,-1), 6),
        ('RIGHTPADDING', (1,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (0,2), 0),
        ('RIGHTPADDING', (0,0), (0,2), 0),
    ]
    diagnostic_table.setStyle(TableStyle(diagnostic_table_style))
    story.append(diagnostic_table)

    # 7. Intervention Vertical block
    actions_correctives = intervention.actions_menees.replace('\n', '<br/>') if intervention.actions_menees else "—"
    pieces = intervention.piece_rechange or "—"
    
    duree_val = f"{int(intervention.duree_minutes)} min" if intervention.duree_minutes is not None else "—"
    cout_val = f"{intervention.cout_piece_dt:.3f} DT" if intervention.cout_piece_dt is not None else "—"
    
    intervention_data = [
        [
            RotatedText("Intervention", style_rotated),
            Paragraph(f"<b>Description de l'intervention / Intervention's description</b><br/>{actions_correctives}", style_label_val),
            Paragraph(f"<b>pièces de rechange / spare part</b><br/>{pieces}", style_label_val)
        ],
        [
            "",
            Paragraph(f"<b>Durée de l'intervention / intervention's duration</b> &nbsp; &nbsp; &nbsp; <b>{duree_val}</b>", style_label_val),
            Paragraph(f"<b>coût / cost</b> &nbsp; &nbsp; &nbsp; <b>{cout_val}</b>", style_label_val)
        ]
    ]
    
    intervention_table = Table(intervention_data, colWidths=[0.8*cm, 9.1*cm, 9.1*cm])
    intervention_table_style = [
        ('SPAN', (0,0), (0,1)),
        ('LINELEFT', (0,0), (0,-1), 1, colors.black),
        ('LINERIGHT', (-1,0), (-1,-1), 1, colors.black),
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.black),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('VALIGN', (0,0), (0,1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (1,0), (-1,-1), 6),
        ('RIGHTPADDING', (1,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (0,1), 0),
        ('RIGHTPADDING', (0,0), (0,1), 0),
    ]
    intervention_table.setStyle(TableStyle(intervention_table_style))
    story.append(intervention_table)

    # 8. Validation / Observation / Opérateur
    val_obs_op_data = [
        [
            Paragraph(f"<b>Validation et essai / validation and testing:</b><br/>{intervention.validation_essai or '—'}", style_label_val),
            Paragraph(f"<b>Observation / observations:</b><br/>{intervention.observation or '—'}", style_label_val),
            Paragraph(f"<b>Nom de l'opérateur / Name of the operator:</b><br/>{intervention.nom_operateur or '—'}", style_label_val),
        ]
    ]
    val_obs_op_table = Table(val_obs_op_data, colWidths=[6.33*cm, 6.33*cm, 6.34*cm])
    val_obs_op_table.setStyle(TableStyle(get_no_top_border_style()))
    story.append(val_obs_op_table)

    # 9. Bottom Signatures
    bottom_sig_data = [
        [
            Paragraph(f"<b>Nom et Signature du technicien / Name and signature of the technician</b><br/><b>{intervention.nom_receptionnaire or '—'}</b><br/><br/><br/>", style_label_val),
            Paragraph(f"<b>Nom et Signature du réclamant / Name and signature of the claimant</b><br/><b>{intervention.nom_demandeur or '—'}</b><br/><br/><br/>", style_label_val),
        ]
    ]
    bottom_sig_table = Table(bottom_sig_data, colWidths=[9.5*cm, 9.5*cm])
    bottom_sig_table.setStyle(TableStyle(get_no_top_border_style()))
    story.append(bottom_sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()