const PDFDocument = require('pdfkit');

class PDFGenerator {
  constructor() {
    this.pageWidth = 612;
    this.pageHeight = 792;
    this.margin = 40;
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.maxY = this.pageHeight - this.margin - 20;
  }

  generatePDF(reportData, systemName = 'HoneyGlow Threat Intelligence System') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'Letter',
          margin: 0,
          bufferPages: true
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addCoverPage(doc, reportData, systemName);
        this.addNarrativeSection(doc, reportData);
        this.addMetricsAndDataSections(doc, reportData);

        this.addFooters(doc, reportData.generatedAt);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addCoverPage(doc, reportData, systemName) {
    // Cover background
    doc.rect(0, 0, this.pageWidth, this.pageHeight).fill('#0d1b2a');

    // Title
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(32)
      .text('THREAT INTELLIGENCE', this.margin, 80, {
        width: this.contentWidth,
        align: 'center'
      });

    doc.fontSize(32).text('REPORT', this.margin, 120, {
      width: this.contentWidth,
      align: 'center'
    });

    // Honeypot name
    doc
      .fontSize(16)
      .fillColor('#B0BEC5')
      .text(systemName, this.margin, 200, {
        width: this.contentWidth,
        align: 'center'
      });

    // Divider
    doc
      .moveTo(this.margin, 250)
      .lineTo(this.pageWidth - this.margin, 250)
      .stroke('#FF6B6B');

    // Metadata
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#E0E0E0')
      .text(`Generated: ${this.formatDateTime(reportData.generatedAt)}`, this.margin, 280, {
        width: this.contentWidth,
        align: 'center'
      });

    doc.fontSize(11).text(`Reporting Window: Last ${reportData.hours} hours`, {
      width: this.contentWidth,
      align: 'center'
    });

    // KPI boxes
    doc.moveDown(3);
    this.drawCoverKpiBoxes(doc, [
      { label: 'Total Attacks', value: String(reportData.stats.summary_statistics?.total_attacks || 0) },
      { label: 'Blocked', value: String(reportData.stats.summary_statistics?.blocked_attacks || 0) },
      { label: 'Threat Score', value: '8/10' }
    ]);

    // Confidential marking
    doc
      .fontSize(14)
      .fillColor('#FF6B6B')
      .font('Helvetica-Bold')
      .text('CONFIDENTIAL', this.margin, this.pageHeight - 80, {
        width: this.contentWidth,
        align: 'center'
      });

    doc
      .fontSize(9)
      .fillColor('#B0BEC5')
      .font('Helvetica')
      .text('Internal Use Only - Distribution Restricted', {
        width: this.contentWidth,
        align: 'center'
      });
  }

  drawCoverKpiBoxes(doc, kpis) {
    const boxWidth = (this.contentWidth - 20) / 3;
    const boxHeight = 50;
    const startY = 380;

    kpis.forEach((kpi, i) => {
      const x = this.margin + i * (boxWidth + 10);

      // Box background
      doc.rect(x, startY, boxWidth, boxHeight).fill('#1a2f42');

      // Value
      doc
        .fillColor('#4FC3F7')
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(kpi.value, x, startY + 8, {
          width: boxWidth,
          align: 'center'
        });

      // Label
      doc
        .fillColor('#90CAF9')
        .font('Helvetica')
        .fontSize(9)
        .text(kpi.label, x, startY + 32, {
          width: boxWidth,
          align: 'center'
        });
    });
  }

  parseNarrativeContent(narrative) {
    // Parse custom tags and clean markdown
    const sections = [];
    let currentSection = null;
    const lines = narrative.split('\n');

    lines.forEach((line) => {
      line = line.trim();
      if (!line) return;

      // Parse [SECTION]Title
      if (line.startsWith('[SECTION]')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          type: 'section',
          title: line.replace('[SECTION]', '').trim(),
          content: []
        };
      }
      // Parse [BULLET]
      else if (line.startsWith('[BULLET]')) {
        if (!currentSection) {
          currentSection = { type: 'content', content: [] };
        }
        currentSection.content.push({
          type: 'bullet',
          text: line.replace('[BULLET]', '').trim()
        });
      }
      // Parse [HIGHLIGHT]
      else if (line.startsWith('[HIGHLIGHT]')) {
        if (!currentSection) {
          currentSection = { type: 'content', content: [] };
        }
        currentSection.content.push({
          type: 'highlight',
          text: line.replace('[HIGHLIGHT]', '').trim()
        });
      }
      // Regular paragraphs
      else if (line) {
        if (!currentSection) {
          currentSection = { type: 'content', content: [] };
        }
        // Clean markdown from line
        let cleanText = line
          .replace(/\*\*/g, '')
          .replace(/\*(?!\w)/g, '')
          .replace(/#+\s/g, '')
          .replace(/`/g, '');

        currentSection.content.push({
          type: 'paragraph',
          text: cleanText
        });
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  }

  addNarrativeSection(doc, reportData) {
    doc.addPage();
    doc.margin = this.margin;

    const narrative = reportData.narrative || 'No narrative available.';
    const sections = this.parseNarrativeContent(narrative);

    sections.forEach((section) => {
      if (section.type === 'section') {
        // Section title with navy background
        this.ensurePageSpace(doc, 30);
        doc.moveDown(0.3);

        // Navy bar background
        doc.rect(this.margin, doc.y, this.contentWidth, 24).fill('#1a237e');

        // White title text
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(12)
          .text(section.title, this.margin + 8, doc.y + 6, {
            width: this.contentWidth - 16
          });

        doc.moveDown(1.2);
      }

      // Content items
      section.content.forEach((item) => {
        if (item.type === 'bullet') {
          this.ensurePageSpace(doc, 16);
          doc
            .fillColor('#1A1A1A')
            .font('Helvetica')
            .fontSize(10)
            .text(`• ${item.text}`, this.margin + 8, doc.y, {
              width: this.contentWidth - 16
            });
        } else if (item.type === 'highlight') {
          this.ensurePageSpace(doc, 18);
          // Light red background for highlights
          const startY = doc.y;
          doc.rect(this.margin, startY, this.contentWidth, 18).fill('#ffebee');

          doc
            .fillColor('#C62828')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(item.text, this.margin + 6, startY + 3, {
              width: this.contentWidth - 12
            });
          doc.moveDown(1);
        } else if (item.type === 'paragraph') {
          this.ensurePageSpace(doc, 16);
          doc
            .fillColor('#1A1A1A')
            .font('Helvetica')
            .fontSize(10)
            .text(item.text, this.margin, doc.y, {
              width: this.contentWidth
            });
        }
      });

      doc.moveDown(0.5);
    });
  }

  addMetricsAndDataSections(doc, reportData) {
    doc.addPage();
    doc.margin = this.margin;

    // Attack Types
    if (reportData.stats.attack_type_breakdown && reportData.stats.attack_type_breakdown.length > 0) {
      this.addSectionHeader(doc, 'Attack Type Distribution');
      const rows = reportData.stats.attack_type_breakdown.map((item) => [
        item.type,
        String(item.count),
        `${item.percentage}%`
      ]);
      this.drawTable(doc, ['Attack Type', 'Count', 'Share'], rows, [250, 100, 100]);
    }

    // Top IPs
    if (reportData.stats.top_threat_actors && reportData.stats.top_threat_actors.length > 0) {
      this.addSectionHeader(doc, 'Top Threat Actors');
      const rows = reportData.stats.top_threat_actors.slice(0, 12).map((item) => [
        item.ip,
        item.country || 'Unknown',
        String(item.total_events)
      ]);
      this.drawTable(doc, ['IP Address', 'Country', 'Events'], rows, [180, 140, 80]);
    }

    // Endpoints
    if (reportData.stats.endpoint_analysis && reportData.stats.endpoint_analysis.length > 0) {
      this.addSectionHeader(doc, 'Targeted Endpoints');
      const rows = reportData.stats.endpoint_analysis.slice(0, 12).map((item) => [
        this.truncate(item.endpoint, 45),
        String(item.total_hits),
        (item.methods || []).slice(0, 2).join(', ')
      ]);
      this.drawTable(doc, ['Endpoint', 'Hits', 'Methods'], rows, [280, 60, 100]);
    }

    // Severity Distribution
    if (reportData.stats.severity_distribution) {
      this.addSectionHeader(doc, 'Severity Distribution');
      const severityRows = [
        ['CRITICAL', String(reportData.stats.severity_distribution.CRITICAL),
          `${reportData.stats.severity_distribution.CRITICAL_percentage}%`],
        ['HIGH', String(reportData.stats.severity_distribution.HIGH),
          `${reportData.stats.severity_distribution.HIGH_percentage}%`],
        ['MEDIUM', String(reportData.stats.severity_distribution.MEDIUM),
          `${reportData.stats.severity_distribution.MEDIUM_percentage}%`],
        ['LOW', String(reportData.stats.severity_distribution.LOW),
          `${reportData.stats.severity_distribution.LOW_percentage}%`]
      ];
      this.drawTable(doc, ['Level', 'Count', 'Percentage'], severityRows, [150, 120, 120]);
    }

    // Geographic Distribution
    if (reportData.stats.geographic_distribution && reportData.stats.geographic_distribution.length > 0) {
      this.addSectionHeader(doc, 'Geographic Distribution');
      const geoRows = reportData.stats.geographic_distribution.slice(0, 12).map((item) => [
        item.country || 'Unknown',
        String(item.event_count)
      ]);
      if (geoRows.length > 0) {
        this.drawTable(doc, ['Country', 'Events'], geoRows, [300, 100]);
      }
    }
  }

  addSectionHeader(doc, title) {
    this.ensurePageSpace(doc, 28);
    doc.moveDown(0.3);

    // Navy bar background
    doc.rect(this.margin, doc.y, this.contentWidth, 20).fill('#1a237e');

    // White title text
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title, this.margin + 6, doc.y + 4, {
        width: this.contentWidth - 12
      });

    doc.moveDown(1.2);
  }

  drawTable(doc, headers, rows, colWidths, fontSize = 9) {
    if (!rows || rows.length === 0) return;

    const lineHeight = fontSize + 5;
    this.ensurePageSpace(doc, lineHeight * (rows.length + 1) + 4);

    const startX = this.margin;
    let y = doc.y;

    // Header row
    doc.rect(startX, y, this.contentWidth, lineHeight).fill('#1a237e');
    let x = startX;
    headers.forEach((header, idx) => {
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(fontSize)
        .text(String(header), x + 4, y + 3, {
          width: colWidths[idx] - 8,
          ellipsis: true
        });
      x += colWidths[idx];
    });

    y += lineHeight;

    // Data rows
    rows.forEach((row, rowIdx) => {
      const bgColor = rowIdx % 2 === 0 ? '#FFFFFF' : '#f5f5f5';
      doc.rect(startX, y, this.contentWidth, lineHeight).fill(bgColor);
      doc.stroke('#D0D0D0');

      x = startX;
      row.forEach((cell, idx) => {
        doc
          .fillColor('#1A1A1A')
          .font('Helvetica')
          .fontSize(fontSize)
          .text(String(cell || ''), x + 4, y + 3, {
            width: colWidths[idx] - 8,
            ellipsis: true
          });
        x += colWidths[idx];
      });

      y += lineHeight;
    });

    doc.y = y;
    doc.moveDown(0.3);
  }

  ensurePageSpace(doc, requiredHeight) {
    // Check if we need a new page
    if (doc.y + requiredHeight > this.maxY) {
      doc.addPage();
      doc.y = this.margin;
    }
  }

  addFooters(doc, generatedAt) {
    const range = doc.bufferedPageRange();
    const total = range.count;

    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);
      const y = this.pageHeight - 15;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#666666')
        .text(
          `HoneyGlow Threat Intelligence Report | CONFIDENTIAL | Generated ${this.formatDateTime(generatedAt)} | Page ${i + 1} of ${total}`,
          this.margin,
          y,
          {
            width: this.contentWidth,
            align: 'center'
          }
        );
    }
  }

  formatDateTime(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) {
      return 'N/A';
    }
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }

  truncate(value, maxLen) {
    const text = String(value || '');
    if (text.length <= maxLen) {
      return text;
    }
    return `${text.slice(0, maxLen - 3)}...`;
  }
}

module.exports = new PDFGenerator();
