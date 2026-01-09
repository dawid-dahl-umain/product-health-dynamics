import { ICON_SETTINGS, ICON_ADJUSTMENTS } from "./icons";

type HeaderProps = {
  settingsOpen: boolean;
};

const LOGO_SVG = `<svg class="app-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 16h4l2-6 4 12 2-6h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" opacity="0.2"/>
</svg>`;

export const buildHeader = ({ settingsOpen }: HeaderProps): string => {
  const activeClass = settingsOpen ? "active" : "";
  return `
    <div class="header">
      <div class="header-brand">
        ${LOGO_SVG}
        <h1>Product Health Dynamics</h1>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="global-settings-btn" title="Global Settings">${ICON_ADJUSTMENTS}</button>
        <button class="settings-toggle ${activeClass}" id="settings-toggle" title="Configure this simulation">
          ${ICON_SETTINGS}
          <span class="settings-toggle-text">Configure</span>
        </button>
      </div>
    </div>
  `;
};
