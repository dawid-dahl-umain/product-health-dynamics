import { ICON_CLOSE } from "./icons";
import type { GlobalConfig } from "../storage/types";

type GlobalSettingsModalProps = {
  isVisible: boolean;
  globalConfig: GlobalConfig;
};

export const buildGlobalSettingsModal = ({
  isVisible,
  globalConfig,
}: GlobalSettingsModalProps): string => {
  const visibilityAll = globalConfig.defaultVisibility === "all";
  return `
    <div class="modal-overlay ${isVisible ? "visible" : ""}" id="global-modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Global Settings</h2>
          <button class="modal-close" id="close-global-modal">${ICON_CLOSE}</button>
        </div>
        <div class="modal-body">
          <div class="modal-row">
            <span>Show confidence bands by default</span>
            <label class="toggle">
              <input type="checkbox" id="visibility-toggle" ${visibilityAll ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
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

