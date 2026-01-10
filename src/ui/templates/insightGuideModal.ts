import { ICON_CLOSE } from "./icons";
import { buildPHInsightCard } from "./phInsightModal";

type InsightGuideModalProps = {
  isVisible: boolean;
};

export const buildInsightGuideModal = ({
  isVisible,
}: InsightGuideModalProps): string => {
  const exampleCard = buildPHInsightCard({
    developerName: "Senior Engineer",
    changeNumber: 847,
    healthValue: 7.2,
    showSource: false,
  });

  return `
    <div class="modal-overlay ${
      isVisible ? "visible" : ""
    }" id="insight-guide-modal-overlay">
      <div class="modal insight-guide-modal">
        <div class="modal-header">
          <h2>Click the Chart to Explore</h2>
          <button class="modal-close" id="close-insight-guide-modal">${ICON_CLOSE}</button>
        </div>
        <div class="modal-body">
          <p class="guide-intro">
            Product Health measures software quality. Click any point to see how it affects customers.
          </p>

          <div class="guide-popup-preview">
            ${exampleCard}
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
