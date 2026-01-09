import { ICON_CLOSE } from "./icons";
import type { GlobalConfig } from "../storage/types";

type GlobalSettingsModalProps = {
  isVisible: boolean;
  globalConfig: GlobalConfig;
  nChanges: number;
};

export const buildGlobalSettingsModal = ({
  isVisible,
  globalConfig,
  nChanges,
}: GlobalSettingsModalProps): string => {
  const visibilityAll = globalConfig.defaultVisibility === "all";
  const annotationPosition = globalConfig.shapeScaleAnnotationPosition ?? 0;
  const annotationLabel = globalConfig.shapeScaleAnnotationLabel ?? "Shape → Scale";
  const simulationRuns = globalConfig.simulationRuns ?? 200;

  return `
    <div class="modal-overlay ${isVisible ? "visible" : ""}" id="global-modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Global Settings</h2>
          <button class="modal-close" id="close-global-modal">${ICON_CLOSE}</button>
        </div>
        <div class="modal-body">
          <div class="modal-row">
            <div>
              <span>Show confidence bands</span>
              <div class="modal-hint">Show 80% confidence intervals around the average</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="visibility-toggle" ${visibilityAll ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="modal-row modal-row-vertical">
            <div class="modal-row-label">
              <span>Monte Carlo Runs</span>
              <span class="modal-hint">Number of simulations to average (max 800). Higher values are smoother but slower.</span>
            </div>
            <div class="modal-row-inputs">
              <input 
                type="number" 
                id="simulation-runs-input" 
                class="modal-text-input"
                value="${simulationRuns}"
                min="50"
                max="800"
                step="50"
              />
            </div>
          </div>

          <div class="modal-row modal-row-vertical">
            <div class="modal-row-label">
              <span>Chart annotation</span>
              <span class="modal-hint">Vertical line marker on the chart</span>
            </div>
            <div class="modal-row-inputs">
              <input 
                type="text" 
                id="annotation-label-input" 
                class="modal-text-input"
                value="${annotationLabel}"
                placeholder="Label text..."
              />
              <div class="modal-row-slider">
                <span class="modal-slider-label">Position:</span>
                <input 
                  type="range" 
                  id="shape-scale-slider" 
                  min="0" 
                  max="${nChanges}" 
                  step="10" 
                  value="${annotationPosition}"
                />
                <span class="shape-scale-value" id="shape-scale-value">${annotationPosition}</span>
              </div>
            </div>
          </div>
          <hr class="modal-divider" />
          <div class="modal-row danger-zone">
            <span>Reset all data to defaults</span>
            <button class="btn-danger" id="reset-all-data">Reset All</button>
          </div>
        </div>
      </div>
    </div>
  `;
};

