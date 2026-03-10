import { ThemeColors } from '../types';

export function generateSelfAssessmentSection(theme: ThemeColors): string {
  return `
    <div class="section-self-assessment">
      <h2 class="section-header" style="color: ${theme.primary}; border-bottom-color: ${theme.primary};">My Learning Reflection</h2>
      <p class="sa-intro">Think about your learning journey in this workbook. Read each statement below and check the box that best describes how you feel.</p>
      
      <table class="sa-table">
        <thead>
          <tr>
            <th class="sa-col-statement">I can...</th>
            <th class="sa-col-rating">Needs Work<br/>🌱</th>
            <th class="sa-col-rating">Getting There<br/>🌿</th>
            <th class="sa-col-rating">Got It!<br/>🌳</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>...understand the main ideas of the reading passages.</td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
          </tr>
          <tr>
            <td>...find specific details and information in the text.</td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
          </tr>
          <tr>
            <td>...understand and use the new vocabulary words.</td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
          </tr>
          <tr>
            <td>...write clear and organized sentences.</td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
          </tr>
          <tr>
            <td>...express my own thoughts and opinions about the topics.</td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
            <td><div class="sa-checkbox"></div></td>
          </tr>
        </tbody>
      </table>

      <div class="sa-questions">
        <div class="sa-q-block">
          <p class="sa-q-text">1. What was your favorite lesson or topic in this workbook? Why?</p>
          <div class="sa-lines">
            <div class="sa-line"></div>
            <div class="sa-line"></div>
            <div class="sa-line"></div>
          </div>
        </div>
        <div class="sa-q-block">
          <p class="sa-q-text">2. What was the most challenging part for you, and how did you overcome it?</p>
          <div class="sa-lines">
            <div class="sa-line"></div>
            <div class="sa-line"></div>
            <div class="sa-line"></div>
          </div>
        </div>
        <div class="sa-q-block">
          <p class="sa-q-text">3. Write down 3 new vocabulary words that you want to remember and use again:</p>
          <div class="sa-lines">
            <div class="sa-line">1.</div>
            <div class="sa-line">2.</div>
            <div class="sa-line">3.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}