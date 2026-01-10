import { ICON_CLOSE } from "./icons";
import { buildPHInsightModalContent } from "./phInsightModal";

type HelpGuideModalProps = {
  isVisible: boolean;
};

const GITHUB_REPO_URL =
  "https://github.com/dawid-dahl-umain/product-health-dynamics";

const buildQuickStartTab = (): string => `
  <div class="help-section">
    <h3>What is this?</h3>
    <p>
      A prediction of how your software's quality will change over time, 
      based on who's working on it and how complex the system is.
    </p>
    
    <h3>Reading the Chart</h3>
    <ul class="help-list">
      <li><strong>Vertical scale:</strong> Quality score (1-10). Higher = easier to change things.</li>
      <li><strong>Horizontal:</strong> Each code change (think commits). Time moves right.</li>
      <li><strong>Lines:</strong> The most likely outcome.</li>
      <li><strong>Shaded areas:</strong> The range of what usually happens. Think "best case to worst case."</li>
    </ul>

    <h3>The Key Insight</h3>
    <p>
      Undisciplined development works at first, then suddenly falls apart. 
      Recovery takes longer than you'd expect.
    </p>

    <div class="help-tip">
      <strong>Try it:</strong> Click any point on a line to see what that 
      quality level means for your customers.
    </div>
  </div>
`;

const buildGlossaryTab = (): string => `
  <div class="help-section">
    <h3>Terms</h3>
    <dl class="help-glossary">
      <div class="glossary-item">
        <dt>Product Health (PH)</dt>
        <dd>A quality score from 1-10. At 10, changes are easy. At 1, every change is a battle.</dd>
      </div>
      <div class="glossary-item">
        <dt>Engineering Rigor (ER)</dt>
        <dd>How carefully changes are made. High rigor = tests, reviews, planning. Low rigor = quick fixes and hoping for the best.</dd>
      </div>
      <div class="glossary-item">
        <dt>System Complexity (SC)</dt>
        <dd>How many moving parts the system has. A simple blog is forgiving; enterprise software punishes mistakes.</dd>
      </div>
      <div class="glossary-item">
        <dt>Shaded Areas</dt>
        <dd>The range of likely outcomes. If you ran this scenario many times, most results would fall here. Wider = more uncertainty.</dd>
      </div>
      <div class="glossary-item">
        <dt>Handoff</dt>
        <dd>When one type of developer takes over from another mid-project, like an AI prototype handed to a senior engineer.</dd>
      </div>
    </dl>

    <div class="help-link-section">
      <p>Want the mathematical details?</p>
      <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener" class="help-repo-link">
        View the model on GitHub →
      </a>
    </div>
  </div>
`;

const buildCustomerImpactTab = (): string => {
  const exampleCard = buildPHInsightModalContent({
    developerName: "Senior Developer",
    changeNumber: 677,
    healthValue: 8.8,
    showSource: true,
    showClose: false,
  });

  return `
    <div class="help-section">
      <h3>Why Does This Matter?</h3>
      <p>
        Software quality directly affects how customers feel about your product. 
        We translate quality scores into <strong>customer sentiment</strong> 
        so you can see the real-world impact.
      </p>

      <div class="help-tip">
        <strong>Try it:</strong> Click any point on a chart line to see this card 
        for that specific quality level.
      </div>

      <div class="help-preview-card">
        ${exampleCard}
      </div>

      <h3>What the Card Shows</h3>
      <dl class="help-glossary compact">
        <div class="glossary-item">
          <dt>Zone</dt>
          <dd>How customers feel, from delighted advocates to frustrated critics.</dd>
        </div>
        <div class="glossary-item">
          <dt>Customer Reality</dt>
          <dd>What they actually experience when using your product.</dd>
        </div>
        <div class="glossary-item">
          <dt>Business Consequence</dt>
          <dd>What it means for revenue, retention, and growth.</dd>
        </div>
      </dl>

      <p class="help-footer-note">
        Use this to show stakeholders why engineering quality matters.
      </p>
    </div>
  `;
};

export const buildHelpGuideModal = ({
  isVisible,
}: HelpGuideModalProps): string => {
  return `
    <div class="modal-overlay help-guide-overlay ${
      isVisible ? "visible" : ""
    }" id="help-guide-modal-overlay">
      <div class="modal help-guide-modal">
        <div class="modal-header">
          <h2>📖 Guide</h2>
          <button class="modal-close" id="close-help-guide-modal">${ICON_CLOSE}</button>
        </div>
        
        <div class="help-tabs">
          <button class="help-tab active" data-tab="quick-start">Quick Start</button>
          <button class="help-tab" data-tab="glossary">Glossary</button>
          <button class="help-tab" data-tab="customer-impact">Customer Impact</button>
        </div>

        <div class="help-tab-content">
          <div class="help-tab-panel active" id="tab-quick-start">
            ${buildQuickStartTab()}
          </div>
          <div class="help-tab-panel" id="tab-glossary">
            ${buildGlossaryTab()}
          </div>
          <div class="help-tab-panel" id="tab-customer-impact">
            ${buildCustomerImpactTab()}
          </div>
        </div>
      </div>
    </div>
  `;
};

