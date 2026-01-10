import { ICON_CLOSE, ICON_CHEVRON_DOWN } from "./icons";
import { buildPHInsightModalContent } from "./phInsightModal";

type InsightGuideModalProps = {
  isVisible: boolean;
};

export const buildInsightGuideModal = ({
  isVisible,
}: InsightGuideModalProps): string => {
  const exampleCard = buildPHInsightModalContent({
    developerName: "Senior Developer",
    changeNumber: 677,
    healthValue: 8.8,
    showSource: true,
    showClose: false,
  });

  return `
    <div class="modal-overlay ${
      isVisible ? "visible" : ""
    }" id="insight-guide-modal-overlay">
      <div class="modal insight-guide-modal">
        <div class="modal-header">
          <h2>💡 Click the Chart to Explore</h2>
          <button class="modal-close" id="close-insight-guide-modal">${ICON_CLOSE}</button>
        </div>
        <div class="modal-body">
          <p class="guide-intro">
            Product Health measures software quality. Click any point in the chart to see how it affects customers.
          </p>

          <div class="guide-preview-section">
            <button class="guide-preview-toggle" id="toggle-guide-preview">
              <span>Show Example Insight</span>
              <span class="toggle-icon">${ICON_CHEVRON_DOWN}</span>
            </button>
            <div class="guide-popup-preview collapsed" id="guide-preview-container">
              ${exampleCard}
            </div>
          </div>

          <div class="guide-legend">
            <div class="guide-legend-item">
              <span class="guide-legend-term">Zone</span>
              <span class="guide-legend-desc">Based on Net Promoter Score research. Shows customer sentiment, from delighted promoters to frustrated detractors.</span>
            </div>
            <div class="guide-legend-item">
              <span class="guide-legend-term">Customer reality</span>
              <span class="guide-legend-desc">What they actually experience and how they behave.</span>
            </div>
            <div class="guide-legend-item">
              <span class="guide-legend-term">Business consequence</span>
              <span class="guide-legend-desc">The impact on revenue, retention, and growth.</span>
            </div>
          </div>

          <p class="guide-footer">
            Use this to show stakeholders the real impact of engineering decisions.
          </p>
        </div>
      </div>
    </div>
  `;
};
