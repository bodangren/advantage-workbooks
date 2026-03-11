import { ThemeColors } from '../types';

export function generateGoalSettingSection(theme?: ThemeColors): string {
  const primaryColor = theme?.primary || '#333';
  
  return `
    <div class="section-goal-setting">
      <h2 class="section-header" style="color: ${primaryColor}; border-bottom: 2px solid ${primaryColor};">My English Learning Goals</h2>
      <p class="gs-intro">Before you begin this workbook, take a moment to think about what you want to achieve.</p>
      
      <div class="gs-form">
        <div class="gs-row">
          <div class="gs-field" style="flex: 2;">
            <span class="gs-label">Name:</span>
            <div class="gs-line"></div>
          </div>
          <div class="gs-field" style="flex: 1;">
            <span class="gs-label">Class:</span>
            <div class="gs-line"></div>
          </div>
          <div class="gs-field" style="flex: 1;">
            <span class="gs-label">Date:</span>
            <div class="gs-line"></div>
          </div>
        </div>

        <div class="gs-section-title" style="color: ${primaryColor};">My Targets</div>
        <div class="gs-row">
          <div class="gs-field" style="flex: 1;">
            <span class="gs-label">Current English Level:</span>
            <div class="gs-line"></div>
          </div>
          <div class="gs-field" style="flex: 1;">
            <span class="gs-label">Target Level / Score:</span>
            <div class="gs-line"></div>
          </div>
        </div>

        <div class="gs-section-title" style="color: ${primaryColor};">My Motivation</div>
        <p class="gs-prompt">Why is learning English important to me?</p>
        <div class="gs-lines-block">
          <div class="gs-long-line"></div>
          <div class="gs-long-line"></div>
          <div class="gs-long-line"></div>
        </div>

        <div class="gs-section-title" style="color: ${primaryColor};">My Action Plan</div>
        <p class="gs-prompt">What are three things I will do to reach my goals?</p>
        <div class="gs-action-list">
          <div class="gs-action-item">
            <span class="gs-number">1.</span>
            <div class="gs-long-line"></div>
          </div>
          <div class="gs-action-item">
            <span class="gs-number">2.</span>
            <div class="gs-long-line"></div>
          </div>
          <div class="gs-action-item">
            <span class="gs-number">3.</span>
            <div class="gs-long-line"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}