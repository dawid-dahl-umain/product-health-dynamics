import { ICON_SETTINGS, ICON_ADJUSTMENTS } from "./icons";

type HeaderProps = {
  settingsOpen: boolean;
};

export const buildHeader = ({ settingsOpen }: HeaderProps): string => {
  const activeClass = settingsOpen ? "active" : "";
  return `
    <div class="header">
      <h1>Product Health Dynamics</h1>
      <div class="header-actions">
        <button class="icon-btn" id="global-settings-btn" title="Global Settings">${ICON_ADJUSTMENTS}</button>
        <button class="settings-toggle ${activeClass}" id="settings-toggle">
          ${ICON_SETTINGS}
          Settings
        </button>
      </div>
    </div>
  `;
};
