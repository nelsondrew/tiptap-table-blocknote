import { getCookie } from 'src/utils/getCookie';

/**
 * Extracts the experience from the user experience cookie
 * Maps cookie values to experience types for test ID generation
 * @returns {string} The experience value (admin, advisor, investor, people)
 */
export const getExperienceFromUrl = (): string => {
  const experience = getCookie('userExp');
  
  // Map cookie values to experience types
  if (experience?.includes('INV_ORGX') || experience?.includes('INVX')) {
    return 'investor';
  }
  if (experience?.includes('BR_ORGX')) {
    return 'advisor';
  }
  if (experience?.includes('TX')) {
    return 'people';
  }
  
  // Default fallback to admin
  return 'admin';
};

/**
 * Generates a test ID with the correct experience
 * @param {string} testId - The test ID without experience
 * @returns {string} The complete test ID with experience
 */
export const generateTestId = (testId: string): string => {
  const experience = getExperienceFromUrl();
  return testId.replace('ap.<experience>', `ap.${experience}`);
}; 