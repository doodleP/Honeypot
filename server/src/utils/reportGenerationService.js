const axios = require('axios');
const AttackLog = require('../models/AttackLog');
const logger = require('./logger');

class ReportGenerationService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.timeout = 180000; // 3 minutes for comprehensive report
  }

  buildAttackFilter(hours) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return {
      timestamp: { $gte: since },
      attackType: { $ne: 'UNKNOWN' }
    };
  }

  normalizeAttackType(attackType) {
    return attackType === 'CREDENTIAL_STUFFING' ? 'BRUTE_FORCE' : attackType;
  }

  async fetchComprehensiveData(hours = 24, limit = 100) {
    try {
      const attackFilter = this.buildAttackFilter(hours);
      const totalAttacks = await AttackLog.countDocuments(attackFilter);

      // Attack Types with severity breakdown
      const attackTypesRaw = await AttackLog.aggregate([
        { $match: attackFilter },
        {
          $project: {
            attackType: {
              $cond: [{ $eq: ['$attackType', 'CREDENTIAL_STUFFING'] }, 'BRUTE_FORCE', '$attackType']
            },
            severity: 1
          }
        },
        { $group: { _id: '$attackType', count: { $sum: 1 }, severities: { $push: '$severity' } } },
        { $sort: { count: -1 } }
      ]);

      const attackTypes = attackTypesRaw.map((a) => {
        const severityCounts = {
          CRITICAL: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0
        };
        a.severities.forEach((sev) => {
          if (severityCounts.hasOwnProperty(sev)) {
            severityCounts[sev]++;
          }
        });
        return {
          type: a._id,
          count: a.count,
          percentage: ((a.count / totalAttacks) * 100).toFixed(2),
          severity_distribution: severityCounts
        };
      });

      // Top IPs with detailed analysis
      const topIPsRaw = await AttackLog.aggregate([
        { $match: attackFilter },
        {
          $group: {
            _id: '$ip',
            count: { $sum: 1 },
            lastSeen: { $max: '$timestamp' },
            firstSeen: { $min: '$timestamp' },
            country: { $first: '$geoip.country' },
            city: { $first: '$geoip.city' },
            attackTypes: { $addToSet: '$attackType' },
            endpoints: { $addToSet: '$endpoint' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]);

      const topIPs = topIPsRaw.map((ip) => ({
        ip: ip._id,
        country: ip.country || 'Unknown',
        city: ip.city || 'Unknown',
        total_events: ip.count,
        attack_types_used: ip.attackTypes.map((t) => this.normalizeAttackType(t)),
        first_seen: ip.firstSeen,
        last_seen: ip.lastSeen,
        targeted_endpoints: ip.endpoints.slice(0, 5)
      }));

      // Targeted Endpoints
      const targetedEndpointsRaw = await AttackLog.aggregate([
        { $match: attackFilter },
        {
          $group: {
            _id: '$endpoint',
            count: { $sum: 1 },
            methods: { $addToSet: '$method' },
            attackTypes: { $addToSet: '$attackType' },
            severities: { $push: '$severity' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 12 }
      ]);

      const targetedEndpoints = targetedEndpointsRaw.map((ep) => {
        const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        ep.severities.forEach((sev) => {
          if (severityCounts.hasOwnProperty(sev)) {
            severityCounts[sev]++;
          }
        });
        return {
          endpoint: ep._id || 'Unknown',
          methods: ep.methods || [],
          total_hits: ep.count,
          attack_types: ep.attackTypes.map((t) => this.normalizeAttackType(t)),
          severity_levels: severityCounts
        };
      });

      // Severity Distribution
      const severityDist = await AttackLog.aggregate([
        { $match: attackFilter },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]);

      const severityMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      severityDist.forEach((s) => {
        if (severityMap.hasOwnProperty(s._id)) {
          severityMap[s._id] = s.count;
        }
      });

      // Blocked vs Allowed
      const successVsFailed = await AttackLog.aggregate([
        { $match: attackFilter },
        { $group: { _id: '$blocked', count: { $sum: 1 } } }
      ]);

      const blocked = successVsFailed.find((s) => s._id === true)?.count || 0;
      const allowed = successVsFailed.find((s) => s._id === false)?.count || 0;

      // Geographic Distribution
      const geoDistribution = await AttackLog.aggregate([
        { $match: { ...attackFilter, 'geoip.country': { $exists: true, $ne: null } } },
        { $group: { _id: '$geoip.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]);

      // Recent Attack Feed
      const recentAttacks = await AttackLog.find(attackFilter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('timestamp ip method attackType endpoint payload severity blocked geoip')
        .lean();

      const formattedRecentAttacks = recentAttacks.map((attack) => ({
        timestamp: attack.timestamp,
        ip: attack.ip || 'Unknown',
        attack_type: this.normalizeAttackType(attack.attackType),
        endpoint: attack.endpoint || attack.url || 'Unknown',
        method: attack.method || 'N/A',
        severity: attack.severity || 'UNKNOWN',
        blocked: Boolean(attack.blocked),
        payload: attack.payload ? attack.payload.substring(0, 100) : ''
      }));

      // Calculate all percentages correctly
      const criticalPct = totalAttacks > 0 ? ((severityMap.CRITICAL / totalAttacks) * 100).toFixed(2) : 0;
      const highPct = totalAttacks > 0 ? ((severityMap.HIGH / totalAttacks) * 100).toFixed(2) : 0;
      const mediumPct = totalAttacks > 0 ? ((severityMap.MEDIUM / totalAttacks) * 100).toFixed(2) : 0;
      const lowPct = totalAttacks > 0 ? ((severityMap.LOW / totalAttacks) * 100).toFixed(2) : 0;
      const blockedPct = totalAttacks > 0 ? ((blocked / totalAttacks) * 100).toFixed(2) : 0;

      return {
        report_metadata: {
          generated_at: new Date().toISOString(),
          reporting_window: `Last ${hours} hours`,
          honeypot_name: 'HoneyGlow'
        },
        summary_statistics: {
          total_attacks: totalAttacks,
          blocked_attacks: blocked,
          allowed_attacks: allowed,
          blocked_percentage: parseFloat(blockedPct),
          unique_source_ips: topIPs.length,
          unique_endpoints_targeted: targetedEndpoints.length,
          most_active_attack_type: attackTypes[0]?.type || 'UNKNOWN',
          most_targeted_endpoint: targetedEndpoints[0]?.endpoint || 'Unknown'
        },
        attack_type_breakdown: attackTypes,
        top_threat_actors: topIPs,
        endpoint_analysis: targetedEndpoints,
        severity_distribution: {
          CRITICAL: severityMap.CRITICAL,
          HIGH: severityMap.HIGH,
          MEDIUM: severityMap.MEDIUM,
          LOW: severityMap.LOW,
          CRITICAL_percentage: parseFloat(criticalPct),
          HIGH_percentage: parseFloat(highPct),
          MEDIUM_percentage: parseFloat(mediumPct),
          LOW_percentage: parseFloat(lowPct)
        },
        recent_attack_feed: formattedRecentAttacks,
        geographic_distribution: geoDistribution.map((g) => ({ country: g._id, event_count: g.count }))
      };
    } catch (error) {
      logger.error('Error fetching comprehensive data:', error);
      throw new Error('Failed to fetch comprehensive attack data');
    }
  }

  buildStructuredPrompt(comprehensiveData) {
    const prompt = `You are a senior cybersecurity analyst writing an official Threat Intelligence Report for executive leadership. 

CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
- Use PLAIN TEXT ONLY - no markdown symbols (no **, no *, no #, no backticks)
- Use [SECTION]Title to mark section starts
- Use [BULLET] at the start of each bullet point
- Use [HIGHLIGHT] before critical findings
- Never contradict the numbers in the JSON data below
- Calculate all percentages directly from the provided counts

Generate these sections in order:

[SECTION]Executive Summary
Write 4-5 paragraphs analyzing ONLY the provided data. Include:
- Total attack volume and time window
- Primary attack types by percentage
- Key geographic and IP patterns
- Most targeted endpoints and why
- Overall risk posture

[SECTION]Attack Type Analysis
For EACH attack type in the data:
- Technical explanation of the attack
- Why attackers use it
- Specific threat to this honeypot
- Exact count and percentage from data

[SECTION]Threat Actor Profiling
For each top IP in the data:
- Attack patterns and frequency
- Geographic origin and significance
- Time-based behavior patterns
- Types of attacks employed
- What this suggests about the attacker

[SECTION]Endpoint Vulnerability Assessment
For each targeted endpoint in the data:
- Why this endpoint is targeted
- What attackers are attempting
- Current risk level
- Specific defense recommendations

[SECTION]Severity and Risk Distribution
Analyze the severity breakdown:
- CRITICAL count and percentage
- HIGH count and percentage
- MEDIUM count and percentage
- LOW count and percentage
- What this distribution means for overall risk

[SECTION]Indicators of Compromise
List all IoCs from the data:
[BULLET] Source IPs: list top IPs from data
[BULLET] Targeted endpoints: list all endpoints from data
[BULLET] Attack types observed: list all attack types from data
[BULLET] Geographic origins: list countries from data

[SECTION]Risk Assessment and Scoring
Provide risk score 1-10 based on:
- Volume: ${comprehensiveData.summary_statistics.total_attacks} total attacks
- Blocked rate: ${comprehensiveData.summary_statistics.blocked_percentage}%
- Critical severity count: ${comprehensiveData.severity_distribution.CRITICAL}
- Attack type diversity: ${comprehensiveData.attack_type_breakdown.length} types
- Concentration: Top IP had ${comprehensiveData.top_threat_actors[0]?.total_events || 0} events

[SECTION]Immediate Mitigation Actions
Provide 15+ specific, actionable recommendations based on the data. Reference actual endpoints and IPs found in your data.

[SECTION]Conclusion
2 paragraphs summarizing threat landscape and urgency of action.

HERE IS THE HONEYPOT DATA IN JSON FORMAT:
${JSON.stringify(comprehensiveData, null, 2)}

Remember: PLAIN TEXT ONLY. No markdown. Only use [SECTION], [BULLET], [HIGHLIGHT] tags.`;

    return prompt;
  }

  async callOllama(prompt) {
    try {
      const startTime = Date.now();
      logger.info(`Calling Ollama at ${this.ollamaUrl} with model ${this.ollamaModel}`);

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.ollamaModel,
          prompt,
          stream: false,
          temperature: 0.15,
          top_p: 0.9,
          num_predict: 6000,
          top_k: 40,
          repeat_penalty: 1.1
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`Ollama generation completed in ${duration}s`);

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama');
      }

      return response.data.response.trim();
    } catch (error) {
      logger.error('Error calling Ollama:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Ollama service is not running at ${this.ollamaUrl}`);
      }
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  cleanOllamaOutput(text) {
    // Remove markdown symbols but keep tags
    return text
      .replace(/\*\*/g, '') // Remove **
      .replace(/\*(?!\w)/g, '') // Remove * but not in words
      .replace(/#+\s/g, '') // Remove # headers
      .replace(/```/g, '') // Remove code blocks
      .replace(/~~(.+?)~~/g, '$1') // Remove strikethrough
      .replace(/__(.+?)__/g, '$1') // Remove underline
      .replace(/\[(.+?)\]\((.+?)\)/g, '$1'); // Convert links to text
  }

  async generateReport(options = {}) {
    const hours = Number.isFinite(Number(options.hours)) ? Math.max(1, Number(options.hours)) : 24;
    const limit = Number.isFinite(Number(options.limit)) ? Math.min(200, Math.max(20, Number(options.limit))) : 100;

    logger.info(`Starting comprehensive report generation for last ${hours} hours with ${limit} recent attacks`);

    const comprehensiveData = await this.fetchComprehensiveData(hours, limit);

    if (comprehensiveData.summary_statistics.total_attacks === 0) {
      return {
        generatedAt: new Date().toISOString(),
        hours,
        stats: comprehensiveData,
        recentAttacks: [],
        narrative: '[SECTION]Executive Summary\nNo attacks were recorded in the selected time window.'
      };
    }

    let narrative;
    try {
      const prompt = this.buildStructuredPrompt(comprehensiveData);
      narrative = await this.callOllama(prompt);
      narrative = this.cleanOllamaOutput(narrative);
    } catch (error) {
      logger.warn(`Ollama generation failed, using fallback: ${error.message}`);
      narrative = this.buildFallbackNarrative(comprehensiveData);
    }

    return {
      generatedAt: new Date().toISOString(),
      hours,
      stats: comprehensiveData,
      recentAttacks: comprehensiveData.recent_attack_feed,
      narrative,
      metadata: comprehensiveData.report_metadata
    };
  }

  buildFallbackNarrative(data) {
    const stats = data.summary_statistics;
    const topAttack = data.attack_type_breakdown[0];
    const topIp = data.top_threat_actors[0];
    const topEndpoint = data.endpoint_analysis[0];

    return `[SECTION]Executive Summary
Over the last ${data.report_metadata.reporting_window}, the honeypot detected ${stats.total_attacks} attack events. This represents significant hostile activity requiring immediate attention. The attack surface includes ${stats.unique_endpoints_targeted} targeted endpoints originating from ${stats.unique_source_ips} unique source IP addresses.

Primary attack vectors include ${data.attack_type_breakdown.map((a) => `${a.type} (${a.percentage}%)`).join(', ')}. The severity distribution shows ${data.severity_distribution.CRITICAL} critical events, ${data.severity_distribution.HIGH} high-severity events, indicating a HIGH overall risk posture.

Blocked vs Allowed ratio shows only ${stats.blocked_percentage}% were blocked, meaning ${stats.allowed_attacks} malicious requests passed through defenses. This low block rate indicates defensive gaps.

[SECTION]Threat Actor Profiling
Top threat actor ${topIp.ip} from ${topIp.country} conducted ${topIp.total_events} attack events using ${topIp.attack_types_used.join(', ')} patterns. This concentration suggests automated scanner or targeted reconnaissance.

[SECTION]Endpoint Vulnerability Assessment
Most targeted endpoint ${topEndpoint.endpoint} received ${topEndpoint.total_hits} attack attempts, vulnerable to ${topEndpoint.attack_types.join(', ')}.

[SECTION]Risk Assessment and Scoring
Risk Score: 8/10 - HIGH
Based on: ${stats.total_attacks} total events, ${stats.blocked_percentage}% blocked, ${data.severity_distribution.CRITICAL} critical severity, ${data.attack_type_breakdown.length} attack types, concentrated patterns.

[SECTION]Immediate Mitigation Actions
[BULLET] Implement rate limiting on ${topEndpoint.endpoint}
[BULLET] Block or monitor IP ${topIp.ip} from ${topIp.country}
[BULLET] Deploy WAF signatures for ${topAttack.type}
[BULLET] Enable MFA on critical endpoints
[BULLET] Increase alerting for CRITICAL severity
[BULLET] Review authentication mechanisms
[BULLET] Implement IP reputation filtering
[BULLET] Enable bot detection
[BULLET] Review API access controls
[BULLET] Validate input filtering

[SECTION]Conclusion
The honeypot detected ${stats.total_attacks} attack events with only ${stats.blocked_percentage}% blocked. This indicates significant defensive gaps. Immediate action required to prevent production compromise.`;
  }
}

module.exports = new ReportGenerationService();
