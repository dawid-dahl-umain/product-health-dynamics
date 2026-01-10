import { ICON_CLOSE } from "./icons";
import { buildPHInsightModalContent } from "./phInsightModal";

type HelpGuideModalProps = {
  isVisible: boolean;
};

const GITHUB_REPO_URL =
  "https://github.com/dawid-dahl-umain/product-health-dynamics";

const MODEL_DIAGRAM = `flowchart LR
    subgraph inputs ["INPUTS (you choose)"]
        direction TB
        ER["<b>Engineering Rigor</b><br/>How disciplined is the developer?<br/><i>0 = vibe coding, 1 = senior engineer</i>"]
        SC["<b>System Complexity</b><br/>How complex is the system?<br/><i>0.25 = blog, 0.85 = enterprise</i>"]
    end

    subgraph derived ["DERIVED"]
        direction TB
        BI["<b>Base Impact</b><br/>Does each change<br/>help or hurt on average?"]
        BS["<b>Base Sigma</b><br/>How predictable<br/>are the outcomes?"]
        MH["<b>Max Product Health</b><br/>Best sustainable<br/>quality level"]
    end

    subgraph loop ["DEVELOPMENT CYCLE ⟳ (repeats each commit)"]
        direction TB
        PH["<b>Current Product Health</b><br/>How easy is the code<br/>to change right now?<br/><i>1 = nightmare, 10 = dream</i>"]

        subgraph state ["System Dynamics"]
            direction LR
            TR["<b>Traction</b><br/>How well do<br/>improvements land?<br/><i>Low at bad PH, high at good PH</i>"]
            FR["<b>Fragility</b><br/>How severely does<br/>damage cascade?<br/><i>High at bad PH, low at good PH</i>"]
        end

        CE(("<b>Change</b><br/><b>Event</b><br/>roll the dice"))
        NPH["<b>New Product Health</b><br/>Better, worse,<br/>or same?"]

        PH -->|"PH affects"| TR & FR
        TR -->|"gates improvement"| CE
        FR -->|"amplifies damage"| CE
        CE -->|"produces"| NPH
        NPH -.->|"becomes next"| PH
    end

    style state fill:none,stroke:#22d3ee,stroke-width:2px,stroke-dasharray: 5 5

    AC["<b>Accumulated</b><br/><b>Complexity</b><br/>Grows with each change<br/><i>hard to outpace, even for seniors</i>"]
    TC["<b>Time Cost</b><br/>How long does each<br/>change take?<br/><i>1x when healthy, 3x when degraded</i>"]

    ER -->|"determines"| BI & BS & MH
    SC -->|"harder to improve"| BI
    SC -->|"amplifies"| FR
    SC -->|"slows recovery"| TR
    SC -->|"faster buildup"| AC
    BI & BS & MH -->|"feed into"| CE
    AC -->|"drags down"| CE
    PH -->|"determines"| TC

    style inputs fill:none,stroke:#4ade80,stroke-width:2px
    style derived fill:none,stroke:#fb923c,stroke-width:2px
    style loop fill:none,stroke:#60a5fa,stroke-width:2px

    classDef inputNode fill:#166534,stroke:#4ade80,color:#fff
    classDef derivedNode fill:#9a3412,stroke:#fb923c,color:#fff
    classDef loopNode fill:#1e40af,stroke:#60a5fa,color:#fff
    classDef stateNode fill:#0e7490,stroke:#22d3ee,color:#fff
    classDef timeNode fill:#581c87,stroke:#a855f7,color:#fff
    classDef eventNode fill:#0f172a,stroke:#60a5fa,color:#fff

    class ER,SC inputNode
    class BI,BS,MH derivedNode
    class PH,NPH loopNode
    class TR,FR stateNode
    class CE eventNode
    class AC,TC timeNode`;

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
      <div class="glossary-item glossary-item-expanded">
        <dt>Engineering Rigor (ER)</dt>
        <dd>
          How well complexity is managed.
          <ul class="glossary-inline-list">
            <li><strong>High rigor:</strong> modular design, clean abstractions, loose coupling, sophisticated test strategies</li>
            <li><strong>Low rigor:</strong> quick fixes that create tangled dependencies</li>
          </ul>
          <div class="glossary-detail">
            <p>Simple code keeps concerns separate; you can reason about each part on its own. 
            Tangled code forces you to understand everything to change anything.</p>
            <ul>
              <li><strong>Modularity</strong> – self-contained pieces that can be changed independently</li>
              <li><strong>Abstraction</strong> – hiding complexity behind simple interfaces</li>
              <li><strong>Cohesion</strong> – related things grouped together</li>
              <li><strong>Separation of concerns</strong> – each part handles one responsibility</li>
              <li><strong>Loose coupling</strong> – minimal dependencies between parts</li>
            </ul>
          </div>
        </dd>
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

const buildModelTab = (): string => `
  <div class="help-section model-section">
    <h3>How the Simulation Works</h3>
    <p>
      For those curious about the mechanics. This diagram shows how your inputs 
      flow through the model to produce the charts you see.
    </p>
    
    <div class="mermaid-zoom-controls">
      <button class="zoom-btn" id="mermaid-zoom-out" title="Zoom out">−</button>
      <span class="zoom-level" id="mermaid-zoom-level">100%</span>
      <button class="zoom-btn" id="mermaid-zoom-in" title="Zoom in">+</button>
      <button class="zoom-btn zoom-reset" id="mermaid-zoom-reset" title="Reset zoom">Reset</button>
    </div>
    
    <div class="mermaid-container" id="mermaid-container">
      <div class="mermaid-inner" id="mermaid-inner">
        <pre class="mermaid">${MODEL_DIAGRAM}</pre>
      </div>
    </div>

    <div class="help-tip">
      <strong>Reading the diagram:</strong>
      <ul>
        <li><strong>Green:</strong> your inputs</li>
        <li><strong>Orange:</strong> calculated from inputs</li>
        <li><strong>Blue:</strong> the simulation loop (runs for each code change)</li>
        <li><strong>Purple:</strong> time-related factors (complexity accumulation and time cost)</li>
      </ul>
    </div>
  </div>
`;

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
          <button class="help-tab" data-tab="model">Model</button>
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
          <div class="help-tab-panel" id="tab-model">
            ${buildModelTab()}
          </div>
        </div>
      </div>
    </div>
  `;
};
