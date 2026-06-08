from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Flowable, Spacer
from reportlab.graphics.shapes import Drawing, Rect, Ellipse, String, Line, Circle
from reportlab.graphics import renderPDF
from datetime import datetime

# ─── Consomed Brand Colours ───────────────────────────────────────────────────
CONSOMED_BLUE  = colors.HexColor("#0072BC")
CONSOMED_RED   = colors.HexColor("#ED1C24")
CONSOMED_DARK  = colors.HexColor("#004a7c")
HEADER_BG      = colors.HexColor("#f0f7ff")
LIGHT_GRAY     = colors.HexColor("#f5f5f5")
MID_GRAY       = colors.HexColor("#e0e0e0")
TEXT_DARK      = colors.HexColor("#1a1a2e")
TEXT_MED       = colors.HexColor("#444444")


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


def _make_consomed_logo_drawing(width=90, height=38):
    """Draw the CONSOMED logo in vector using ReportLab shapes."""
    d = Drawing(width, height)

    # Oval border
    d.add(Ellipse(width / 2, height / 2, width / 2 - 1, height / 2 - 1,
                  fillColor=colors.white, strokeColor=CONSOMED_BLUE, strokeWidth=1.8))

    # "conso" in blue
    d.add(String(8, height / 2 - 5, "conso",
                 fontName="Helvetica-Bold", fontSize=17,
                 fillColor=CONSOMED_BLUE, textAnchor='start'))

    # "med" in red
    d.add(String(63, height / 2 - 5, "med",
                 fontName="Helvetica", fontSize=15,
                 fillColor=CONSOMED_RED, textAnchor='start'))

    # ® symbol
    d.add(String(width - 12, height / 2 + 5, "®",
                 fontName="Helvetica", fontSize=7,
                 fillColor=CONSOMED_BLUE, textAnchor='start'))

    # Tagline
    d.add(String(width / 2, 5, "Consommables Médicaux",
                 fontName="Helvetica", fontSize=6,
                 fillColor=TEXT_MED, textAnchor='middle'))
    return d


def _make_cert_badge(label_top, label_bot, bg_color, text_color=colors.white, size=26):
    """Draw a small circular certification badge."""
    d = Drawing(size, size)
    d.add(Circle(size / 2, size / 2, size / 2 - 1,
                 fillColor=bg_color, strokeColor=colors.white, strokeWidth=0.5))
    if label_bot:
        d.add(String(size / 2, size / 2 + 1, label_top,
                     fontName="Helvetica-Bold", fontSize=5.5,
                     fillColor=text_color, textAnchor='middle'))
        d.add(String(size / 2, size / 2 - 5, label_bot,
                     fontName="Helvetica-Bold", fontSize=5,
                     fillColor=text_color, textAnchor='middle'))
    else:
        d.add(String(size / 2, size / 2 - 3, label_top,
                     fontName="Helvetica-Bold", fontSize=9,
                     fillColor=text_color, textAnchor='middle'))
    return d


def format_dt(dt):
    if not dt:
        return "—"
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except Exception:
            return dt
    return dt.strftime("%d/%m/%Y  %H:%M")


def generate_fiche_pdf(intervention, machine) -> bytes:
    import io
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.8 * cm,
        leftMargin=0.8 * cm,
        topMargin=0.8 * cm,
        bottomMargin=0.8 * cm,
    )

    # ── Styles ────────────────────────────────────────────────────────────────
    style_center_bold = ParagraphStyle(
        "CenterBold", fontName="Helvetica-Bold",
        fontSize=9, leading=13, alignment=1, textColor=TEXT_DARK
    )
    style_center_small = ParagraphStyle(
        "CenterSmall", fontName="Helvetica",
        fontSize=7.5, leading=10, alignment=1, textColor=TEXT_MED
    )
    style_ref = ParagraphStyle(
        "Ref", fontName="Helvetica-Bold",
        fontSize=8, leading=11, alignment=1, textColor=CONSOMED_BLUE
    )
    style_label_val = ParagraphStyle(
        "LabelVal", fontName="Helvetica",
        fontSize=7.5, leading=11, textColor=TEXT_DARK
    )
    style_label_bold = ParagraphStyle(
        "LabelBold", fontName="Helvetica-Bold",
        fontSize=8, leading=11, textColor=CONSOMED_DARK
    )
    style_rotated = ParagraphStyle(
        "Rotated", fontName="Helvetica-Bold",
        fontSize=7.5, leading=9, alignment=1, textColor=colors.white
    )
    style_section_title = ParagraphStyle(
        "SectionTitle", fontName="Helvetica-Bold",
        fontSize=7, leading=9, alignment=1, textColor=colors.white
    )
    style_small_gray = ParagraphStyle(
        "SmallGray", fontName="Helvetica",
        fontSize=6.5, leading=9, textColor=TEXT_MED
    )

    story = []

    # ═══════════════════════════════════════════════════════════════════════════
    # HEADER — Logo | Title | Reference
    # ═══════════════════════════════════════════════════════════════════════════
    logo_d = _make_consomed_logo_drawing(90, 38)

    # Certification badges in a row
    iso13_badge = _make_cert_badge("ISO", "13485", colors.HexColor("#555555"))
    ce_badge    = _make_cert_badge("CE",  "",      CONSOMED_BLUE)
    iso9_badge  = _make_cert_badge("ISO", "9001",  colors.HexColor("#555555"))
    bpf_badge   = _make_cert_badge("BPF", "",      CONSOMED_DARK)

    badges_data = [[iso13_badge, ce_badge, iso9_badge, bpf_badge]]
    badges_table = Table(badges_data, colWidths=[1.1*cm, 1.1*cm, 1.1*cm, 1.1*cm])
    badges_table.setStyle(TableStyle([
        ('ALIGN',  (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING',  (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING',   (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 0),
    ]))

    logo_cell = Table(
        [[logo_d], [badges_table]],
        colWidths=[4.6*cm]
    )
    logo_cell.setStyle(TableStyle([
        ('ALIGN',  (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',   (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 2),
    ]))

    header_data = [[
        logo_cell,
        Paragraph(
            "Formulaire / Form<br/>"
            "<b>Fiche d'intervention maintenance corrective</b><br/>"
            "<i>Corrective Maintenance Intervention Sheet</i>",
            style_center_bold
        ),
        Table([
            [Paragraph("<b>FOR-MAI-03</b>", style_ref)],
            [Paragraph("Version 00", style_center_small)],
            [Paragraph("Page 1 / 1", style_center_small)],
            [Paragraph("18/05/2022", style_center_small)],
        ], colWidths=[3.4*cm])
    ]]

    header_table = Table(header_data, colWidths=[4.6*cm, 10.9*cm, 3.5*cm])
    header_table.setStyle(TableStyle([
        ('BOX',    (0, 0), (-1, -1), 1.5, CONSOMED_BLUE),
        ('INNERGRID', (0, 0), (-1, -1), 0.75, CONSOMED_BLUE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN',  (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, -1), HEADER_BG),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(header_table)

    # ── Shared helpers ────────────────────────────────────────────────────────
    def section_label(text):
        """Blue side-label for vertical sections."""
        return ParagraphStyle(
            f"SL_{text}", fontName="Helvetica-Bold",
            fontSize=7, leading=9, alignment=1, textColor=colors.white
        )

    GRID_STYLE_BASE = [
        ('BOX',    (0, 0), (-1, -1), 1, CONSOMED_BLUE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, MID_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
    ]

    def no_top_style():
        return [
            ('LINELEFT',  (0, 0), (0, -1),  1, CONSOMED_BLUE),
            ('LINERIGHT', (-1, 0), (-1, -1), 1, CONSOMED_BLUE),
            ('LINEBELOW', (0, 0), (-1, -1),  1, CONSOMED_BLUE),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, MID_GRAY),
            ('VALIGN',    (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING',    (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING',   (0, 0), (-1, -1), 6),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
        ]

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 1 — Machine & Section identifiers
    # ═══════════════════════════════════════════════════════════════════════════
    sec_mach_data = [[
        Paragraph(f"<font size='6' color='#0072BC'><b>SECTION</b></font><br/><b>{machine.section}</b>", style_label_val),
        Paragraph(f"<font size='6' color='#0072BC'><b>CODE MACHINE</b></font><br/><b>{machine.code}</b>", style_label_val),
        Paragraph(f"<font size='6' color='#0072BC'><b>FAMILLE</b></font><br/>{getattr(machine, 'famille', '—')}", style_label_val),
        Paragraph(f"<font size='6' color='#0072BC'><b>ÉTAT</b></font><br/>{getattr(machine, 'etat', '—')}", style_label_val),
    ]]
    sec_mach_table = Table(sec_mach_data, colWidths=[4.75*cm, 4.75*cm, 4.75*cm, 4.75*cm])
    sec_mach_table.setStyle(TableStyle(no_top_style()))
    story.append(sec_mach_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 2 — Dates row
    # ═══════════════════════════════════════════════════════════════════════════
    dates_data = [[
        Paragraph(
            "<font size='6' color='#0072BC'><b>Heure et date de la réclamation</b></font><br/>"
            f"<i>Claim's time and date</i><br/><b>{format_dt(intervention.heure_reclamation)}</b>",
            style_label_val
        ),
        Paragraph(
            "<font size='6' color='#0072BC'><b>Heure et date de l'intervention</b></font><br/>"
            f"<i>Intervention's time and date</i><br/><b>{format_dt(intervention.heure_debut)}</b>",
            style_label_val
        ),
        Paragraph(
            "<font size='6' color='#0072BC'><b>Heure et date de fin</b></font><br/>"
            f"<i>End time and date</i><br/><b>{format_dt(intervention.heure_fin)}</b>",
            style_label_val
        ),
    ]]
    dates_table = Table(dates_data, colWidths=[6.33*cm, 6.33*cm, 6.34*cm])
    dates_table.setStyle(TableStyle(no_top_style()))
    story.append(dates_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 3 — Applicant & Recipient names
    # ═══════════════════════════════════════════════════════════════════════════
    names_data = [[
        Paragraph(
            "<font size='6' color='#0072BC'><b>Nom et signature du demandeur</b></font><br/>"
            f"<i>Name and signature of the applicant</i><br/><b>{intervention.nom_demandeur or '—'}</b><br/><br/><br/>",
            style_label_val
        ),
        Paragraph(
            "<font size='6' color='#0072BC'><b>Nom et signature du réceptionnaire</b></font><br/>"
            f"<i>Name and signature of the recipient</i><br/><b>{intervention.nom_receptionnaire or '—'}</b><br/><br/><br/>",
            style_label_val
        ),
    ]]
    names_table = Table(names_data, colWidths=[9.5*cm, 9.5*cm])
    names_table.setStyle(TableStyle(no_top_style()))
    story.append(names_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 4 — Demandeur / Anomaly Description (blue side-tab)
    # ═══════════════════════════════════════════════════════════════════════════
    anomaly_desc = intervention.description.replace('\n', '<br/>') if intervention.description else "—"

    demandeur_data = [[
        RotatedText("Demandeur / Applicant", style_rotated),
        Paragraph(
            "<font color='#0072BC'><b>Description de l'anomalie / Description of the anomaly</b></font>"
            f"<br/><br/>{anomaly_desc}",
            style_label_val
        )
    ]]
    demandeur_table = Table(demandeur_data, colWidths=[0.85*cm, 18.15*cm])
    dem_style = no_top_style()
    dem_style += [
        ('BACKGROUND', (0, 0), (0, -1), CONSOMED_BLUE),
        ('VALIGN',     (0, 0), (0, -1), 'MIDDLE'),
        ('ALIGN',      (0, 0), (0, -1), 'CENTER'),
        ('LEFTPADDING',  (0, 0), (0, -1), 0),
        ('RIGHTPADDING', (0, 0), (0, -1), 0),
        ('TOPPADDING',   (0, 0), (0, -1), 4),
        ('BOTTOMPADDING',(0, 0), (0, -1), 4),
    ]
    demandeur_table.setStyle(TableStyle(dem_style))
    story.append(demandeur_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 5 — Diagnostic (blue side-tab, 3 rows)
    # ═══════════════════════════════════════════════════════════════════════════
    elec_box = "<b>[✓]</b>" if intervention.nature_electrique else "[  ]"
    mec_box  = "<b>[✓]</b>" if intervention.nature_mecanique  else "[  ]"
    aut_box  = "<b>[✓]</b>" if intervention.nature_autre      else "[  ]"

    nature_str = (
        f"<font color='#0072BC'><b>Nature de la panne / Nature of the breakdown</b></font>"
        f"&nbsp;&nbsp;&nbsp; Électrique / Electric &nbsp; {elec_box}"
        f"&nbsp;&nbsp;&nbsp; Mécanique / Mechanical &nbsp; {mec_box}"
        f"&nbsp;&nbsp;&nbsp; Autre / Other &nbsp; {aut_box}"
    )

    diagnostic_data = [
        [
            RotatedText("Diagnostic / Diagnosis", style_rotated),
            Paragraph(nature_str, style_label_val)
        ],
        [
            "",
            Paragraph(
                f"<font color='#0072BC'><b>Paramètres contrôlés / Controlled settings</b></font>"
                f"<br/>{intervention.parametres_controles or '—'}",
                style_label_val
            )
        ],
        [
            "",
            Paragraph(
                f"<font color='#0072BC'><b>Remarques et constats / Notes and findings</b></font>"
                f"<br/>{intervention.remarques or '—'}",
                style_label_val
            )
        ]
    ]
    diagnostic_table = Table(diagnostic_data, colWidths=[0.85*cm, 18.15*cm])
    diag_style = [
        ('SPAN', (0, 0), (0, 2)),
        ('BACKGROUND', (0, 0), (0, 2), CONSOMED_BLUE),
        ('LINELEFT',  (0, 0), (0, -1),  1, CONSOMED_BLUE),
        ('LINERIGHT', (-1, 0), (-1, -1), 1, CONSOMED_BLUE),
        ('LINEBELOW', (0, 0), (-1, -1),  1, CONSOMED_BLUE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, MID_GRAY),
        ('VALIGN',    (0, 0), (-1, -1), 'TOP'),
        ('VALIGN',    (0, 0), (0, 2),  'MIDDLE'),
        ('ALIGN',     (0, 0), (0, 2),  'CENTER'),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (1, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (1, 0), (-1, -1), 6),
        ('LEFTPADDING',   (0, 0), (0, 2),  0),
        ('RIGHTPADDING',  (0, 0), (0, 2),  0),
    ]
    diagnostic_table.setStyle(TableStyle(diag_style))
    story.append(diagnostic_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 6 — Intervention details (blue side-tab)
    # ═══════════════════════════════════════════════════════════════════════════
    actions_correctives = intervention.actions_menees.replace('\n', '<br/>') if intervention.actions_menees else "—"
    pieces   = intervention.piece_rechange or "—"
    duree_val = f"{int(intervention.duree_minutes)} min" if intervention.duree_minutes is not None else "—"
    cout_val  = f"{intervention.cout_piece_dt:.3f} DT"   if intervention.cout_piece_dt is not None else "—"

    intervention_data = [
        [
            RotatedText("Intervention", style_rotated),
            Paragraph(
                f"<font color='#0072BC'><b>Description de l'intervention / Intervention's description</b></font>"
                f"<br/>{actions_correctives}",
                style_label_val
            ),
            Paragraph(
                f"<font color='#0072BC'><b>Pièces de rechange / Spare parts</b></font>"
                f"<br/>{pieces}",
                style_label_val
            )
        ],
        [
            "",
            Paragraph(
                f"<font color='#0072BC'><b>Durée de l'intervention / Duration</b></font>"
                f"&nbsp;&nbsp;&nbsp;&nbsp; <b>{duree_val}</b>",
                style_label_val
            ),
            Paragraph(
                f"<font color='#0072BC'><b>Coût / Cost</b></font>"
                f"&nbsp;&nbsp;&nbsp;&nbsp; <b>{cout_val}</b>",
                style_label_val
            )
        ]
    ]

    intervention_table = Table(intervention_data, colWidths=[0.85*cm, 9.07*cm, 9.08*cm])
    int_style = [
        ('SPAN', (0, 0), (0, 1)),
        ('BACKGROUND', (0, 0), (0, 1), CONSOMED_BLUE),
        ('LINELEFT',  (0, 0), (0, -1),  1, CONSOMED_BLUE),
        ('LINERIGHT', (-1, 0), (-1, -1), 1, CONSOMED_BLUE),
        ('LINEBELOW', (0, 0), (-1, -1),  1, CONSOMED_BLUE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, MID_GRAY),
        ('VALIGN',    (0, 0), (-1, -1), 'TOP'),
        ('VALIGN',    (0, 0), (0, 1),  'MIDDLE'),
        ('ALIGN',     (0, 0), (0, 1),  'CENTER'),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (1, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (1, 0), (-1, -1), 6),
        ('LEFTPADDING',   (0, 0), (0, 1),  0),
        ('RIGHTPADDING',  (0, 0), (0, 1),  0),
    ]
    intervention_table.setStyle(TableStyle(int_style))
    story.append(intervention_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 7 — Validation / Observation / Opérateur
    # ═══════════════════════════════════════════════════════════════════════════
    val_obs_op_data = [[
        Paragraph(
            f"<font color='#0072BC'><b>Validation et essai / Validation and testing</b></font>"
            f"<br/>{intervention.validation_essai or '—'}",
            style_label_val
        ),
        Paragraph(
            f"<font color='#0072BC'><b>Observation / Observations</b></font>"
            f"<br/>{intervention.observation or '—'}",
            style_label_val
        ),
        Paragraph(
            f"<font color='#0072BC'><b>Nom de l'opérateur / Operator name</b></font>"
            f"<br/>{intervention.nom_operateur or '—'}",
            style_label_val
        ),
    ]]
    val_obs_op_table = Table(val_obs_op_data, colWidths=[6.33*cm, 6.33*cm, 6.34*cm])
    val_obs_op_table.setStyle(TableStyle(no_top_style()))
    story.append(val_obs_op_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECTION 8 — Bottom Signatures
    # ═══════════════════════════════════════════════════════════════════════════
    bottom_sig_data = [[
        Paragraph(
            f"<font color='#0072BC'><b>Nom et Signature du technicien / Technician's name and signature</b></font>"
            f"<br/><b>{intervention.nom_receptionnaire or '—'}</b><br/><br/><br/>",
            style_label_val
        ),
        Paragraph(
            f"<font color='#0072BC'><b>Nom et Signature du réclamant / Claimant's name and signature</b></font>"
            f"<br/><b>{intervention.nom_demandeur or '—'}</b><br/><br/><br/>",
            style_label_val
        ),
    ]]
    bottom_sig_table = Table(bottom_sig_data, colWidths=[9.5*cm, 9.5*cm])
    bottom_sig_table.setStyle(TableStyle(no_top_style()))
    story.append(bottom_sig_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # FOOTER — Blue band with Consomed info & certifications
    # ═══════════════════════════════════════════════════════════════════════════
    footer_data = [[
        Paragraph(
            "<font color='white'><b>CONSOMED</b> — Consommables Médicaux</font>",
            ParagraphStyle("FtL", fontName="Helvetica-Bold", fontSize=7,
                           leading=10, textColor=colors.white)
        ),
        Paragraph(
            "<font color='white'>FOR-MAI-03 • Version 00 • 18/05/2022</font>",
            ParagraphStyle("FtC", fontName="Helvetica", fontSize=7,
                           leading=10, alignment=1, textColor=colors.white)
        ),
        Paragraph(
            "<font color='white'>ISO 13485 • CE • ISO 9001:2008 • BPF</font>",
            ParagraphStyle("FtR", fontName="Helvetica", fontSize=7,
                           leading=10, alignment=2, textColor=colors.white)
        ),
    ]]
    footer_table = Table(footer_data, colWidths=[6.33*cm, 6.33*cm, 6.34*cm])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CONSOMED_BLUE),
        ('LINELEFT',   (0, 0), (0, -1),  1, CONSOMED_BLUE),
        ('LINERIGHT',  (-1, 0), (-1, -1), 1, CONSOMED_BLUE),
        ('LINEBELOW',  (0, 0), (-1, -1),  1, CONSOMED_BLUE),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
    ]))
    story.append(footer_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()