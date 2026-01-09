import { ICON_CLOSE } from "./icons";
import { palette } from "../chart/colors";

type PHInsightModalProps = {
  isVisible: boolean;
  developerName: string;
  changeNumber: number;
  healthValue: number;
};

type BusinessInsight = {
  zone: string;
  zoneColor: string;
  customerReality: string;
  businessConsequence: string;
  gradient: string;
  sourceNote: string;
};

const roundToOneDecimal = (n: number): number => Math.round(n * 10) / 10;

const NPS_SOURCE_URL =
  "https://nps.bain.com/about/measuring-your-net-promoter-score/";
const NPS_SOURCE_LINK = `<a href="${NPS_SOURCE_URL}" target="_blank" rel="noopener">Bain & Company NPS research</a>`;

const zoneColors = {
  promoter: { main: palette.emerald, dark: "#22c55e" },
  passive: { main: palette.saffron, dark: "#d97706" },
  detractor: { main: palette.rose, dark: "#e11d48" },
  crisis: { main: "#ef4444", dark: "#dc2626" },
  collapse: { main: "#b91c1c", dark: "#991b1b" },
  failure: { main: "#991b1b", dark: "#7f1d1d" },
};

const getBusinessInsight = (health: number): BusinessInsight => {
  const h = roundToOneDecimal(health);

  // 9-10: Elite Promoter
  if (h >= 9) {
    return {
      zone: "Elite Promoter",
      zoneColor: zoneColors.promoter.main,
      customerReality:
        "Peak advocacy. Customers are your biggest growth engine.",
      businessConsequence:
        "Maximum lifetime value. Organic growth through referrals. Market leadership.",
      gradient: `linear-gradient(135deg, ${zoneColors.promoter.main} 0%, ${zoneColors.promoter.dark} 100%)`,
      sourceNote: NPS_SOURCE_LINK,
    };
  }

  // 8-9: Promoter
  if (h >= 8) {
    return {
      zone: "Promoter",
      zoneColor: zoneColors.promoter.main,
      customerReality:
        "Customers actively recommend you. They generate 80%+ of all referrals.",
      businessConsequence:
        "2.5x higher lifetime value than detractors. NPS leaders grow 2x faster.",
      gradient: `linear-gradient(135deg, ${zoneColors.promoter.dark} 0%, #16a34a 100%)`,
      sourceNote: NPS_SOURCE_LINK,
    };
  }

  // 7-8: Strong Passive
  if (h >= 7) {
    return {
      zone: "Strong Passive",
      zoneColor: palette.teal,
      customerReality:
        "Satisfied customers with low churn risk, but not actively promoting.",
      businessConsequence:
        "Solid retention. Room for improvement to unlock advocacy.",
      gradient: `linear-gradient(135deg, ${palette.teal} 0%, #0d9488 100%)`,
      sourceNote: NPS_SOURCE_LINK,
    };
  }

  // 6-7: Passive
  if (h >= 6) {
    return {
      zone: "Passive",
      zoneColor: zoneColors.passive.main,
      customerReality:
        "Satisfied but unenthusiastic. Repurchase rates 50% lower than Promoters.",
      businessConsequence:
        "Stable for now, but one competitor move away from losing them.",
      gradient: `linear-gradient(135deg, ${zoneColors.passive.main} 0%, ${zoneColors.passive.dark} 100%)`,
      sourceNote: NPS_SOURCE_LINK,
    };
  }

  // 5-6: Weak Passive
  if (h >= 5) {
    return {
      zone: "Weak Passive",
      zoneColor: "#f59e0b",
      customerReality:
        "Tolerance is wearing thin. Actively comparing alternatives.",
      businessConsequence:
        "Churn likely within 6-12 months without improvement.",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      sourceNote: NPS_SOURCE_LINK,
    };
  }

  // 4-5: Detractor
  if (h >= 4) {
    return {
      zone: "Detractor",
      zoneColor: zoneColors.detractor.main,
      customerReality:
        "Actively unhappy. Responsible for 80%+ of negative word-of-mouth.",
      businessConsequence:
        "High churn. Rising support costs. Damaging your reputation daily.",
      gradient: `linear-gradient(135deg, ${zoneColors.detractor.main} 0%, ${zoneColors.detractor.dark} 100%)`,
      sourceNote: NPS_SOURCE_LINK,
    };
  }

  // 3-4: Strong Detractor
  if (h >= 3) {
    return {
      zone: "Strong Detractor",
      zoneColor: zoneColors.crisis.main,
      customerReality:
        "Trust is broken. Customers are actively leaving and warning others.",
      businessConsequence:
        "Revenue declining. Recovery becomes expensive. Brand damage accelerating.",
      gradient: `linear-gradient(135deg, ${zoneColors.crisis.main} 0%, ${zoneColors.crisis.dark} 100%)`,
      sourceNote: "",
    };
  }

  // 2-3: Churn Crisis
  if (h >= 2) {
    return {
      zone: "Churn Crisis",
      zoneColor: zoneColors.collapse.main,
      customerReality: "Product is seen as fundamentally broken.",
      businessConsequence:
        "Mass exodus. Refund demands. Public complaints mounting.",
      gradient: `linear-gradient(135deg, ${zoneColors.collapse.main} 0%, ${zoneColors.collapse.dark} 100%)`,
      sourceNote: "",
    };
  }

  // 1-2: Collapse
  if (h >= 1) {
    return {
      zone: "Collapse",
      zoneColor: zoneColors.failure.main,
      customerReality: "Customers are gone or hostile.",
      businessConsequence:
        "Business survival at stake. Legal exposure possible.",
      gradient: `linear-gradient(135deg, ${zoneColors.failure.main} 0%, ${zoneColors.failure.dark} 100%)`,
      sourceNote: "",
    };
  }

  // 0-1: Total Failure
  return {
    zone: "Total Failure",
    zoneColor: "#7f1d1d",
    customerReality: "Complete loss of customer base.",
    businessConsequence: "Business unviable. Wind-down likely.",
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)",
    sourceNote: "",
  };
};

const getHealthBarWidth = (health: number): number =>
  Math.max(0, Math.min(100, (health / 10) * 100));

const getConfettiLevel = (health: number): "high" | "low" | "none" => {
  const h = roundToOneDecimal(health);
  if (h >= 9) return "high";
  if (h >= 8) return "low";
  return "none";
};

const getBottomLine = (health: number): string => {
  const h = roundToOneDecimal(health);
  if (h >= 9) return "Exceptional. Keep doing what you're doing.";
  if (h >= 8) return "This is where you want to be.";
  if (h >= 7) return "Good foundation. Push for advocacy.";
  if (h >= 6) return "Stable, but not driving growth.";
  if (h >= 5) return "Warning signs. Act before it's too late.";
  if (h >= 4) return "Every day at this level costs you customers.";
  if (h >= 3) return "Critical. Immediate action required.";
  return "Urgent intervention required.";
};

export const buildPHInsightModal = ({
  isVisible,
  developerName,
  changeNumber,
  healthValue,
}: PHInsightModalProps): string => {
  const insight = getBusinessInsight(healthValue);
  const confetti = getConfettiLevel(healthValue);
  const barWidth = getHealthBarWidth(healthValue);
  const bottomLine = getBottomLine(healthValue);
  const displayValue = roundToOneDecimal(healthValue);

  return `
    <div class="modal-overlay ${
      isVisible ? "visible" : ""
    }" id="ph-insight-modal-overlay" data-confetti="${confetti}">
      <div class="modal ph-insight-modal">
        <div class="modal-header">
          <h2>What Your Customers Feel</h2>
          <button class="modal-close" id="close-ph-insight-modal">${ICON_CLOSE}</button>
        </div>
        <div class="modal-body">
          <div class="ph-insight-context">
            <span class="ph-insight-developer">${developerName}</span>
            <span class="ph-insight-divider">·</span>
            <span class="ph-insight-change">Change ${changeNumber}</span>
          </div>
          
          <div class="ph-health-gauge">
            <div class="ph-health-bar-bg">
              <div class="ph-health-bar-fill" style="width: ${barWidth}%; background: ${
    insight.gradient
  }"></div>
            </div>
            <div class="ph-health-score">
              <span class="ph-health-value" style="color: ${
                insight.zoneColor
              }">${displayValue.toFixed(1)}</span>
              <span class="ph-health-max">/ 10</span>
            </div>
          </div>

          <div class="ph-zone-badge" style="background: ${insight.zoneColor}">
            ${insight.zone}
          </div>
          
          <div class="ph-insight-details">
            <div class="ph-insight-row">
              <span class="ph-insight-label">Customer reality</span>
              <span class="ph-insight-text">${insight.customerReality}</span>
            </div>
            <div class="ph-insight-row">
              <span class="ph-insight-label">Business consequence</span>
              <span class="ph-insight-text">${
                insight.businessConsequence
              }</span>
            </div>
          </div>

          <p class="ph-bottom-line" style="color: ${
            insight.zoneColor
          }">${bottomLine}</p>
          ${
            insight.sourceNote
              ? `<p class="ph-source-note">${insight.sourceNote}</p>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
};

export { getConfettiLevel };
