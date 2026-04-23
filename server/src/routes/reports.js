const express = require('express');
const reportGenerationService = require('../utils/reportGenerationService');
const pdfGenerator = require('../utils/pdfGenerator');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/reports/generate
// Generate a threat intelligence report from attack logs
router.post('/generate', async (req, res) => {
  try {
    logger.info('Report generation request received');
    const hours = Number(req.body?.hours || req.query?.hours || 24);
    const limit = Number(req.body?.limit || req.query?.limit || 50);

    // Generate structured report data from dashboard-aligned logs and stats
    const reportData = await reportGenerationService.generateReport({ hours, limit });

    // Generate PDF
    logger.info('Converting report to PDF...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const pdfBuffer = await pdfGenerator.generatePDF(
      reportData,
      'HoneyGlow Threat Intelligence System'
    );

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="threat_intelligence_report_${timestamp}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    logger.info(`Report generated successfully: threat_intelligence_report_${timestamp}.pdf`);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Report generation error:', error);

    const statusCode = error.message.includes('Ollama') ? 503 : 500;
    res.status(statusCode).json({
      error: 'Failed to generate report',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/reports/logs
// Fetch all attack logs (used by frontend for preview before generation)
router.get('/logs', async (req, res) => {
  try {
    const AttackLog = require('../models/AttackLog');
    const { limit = 100, skip = 0 } = req.query;

    const logs = await AttackLog.find({ attackType: { $ne: 'UNKNOWN' } })
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await AttackLog.countDocuments({ attackType: { $ne: 'UNKNOWN' } });

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/reports/stats
// Fetch comprehensive dashboard statistics (used by frontend for preview)
router.get('/stats', async (req, res) => {
  try {
    const hours = Number(req.query?.hours || 24);
    const stats = await reportGenerationService.fetchDashboardStatistics(hours);

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
