/**
 * Checks the strength of the password based on specific criteria.
 * @param {string} password The password string to validate.
 * @returns {object} An object with boolean flags for each requirement.
 */
export const checkPassword = (password) => {
    // 1. Rename to clarify this is the required number
    const MIN_LENGTH_REQUIRED = 8; 

    // 2. Calculate the boolean result for min length
    const isMinLengthMet = password.length >= MIN_LENGTH_REQUIRED;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    // \d is a good shorthand for [0-9]
    const hasNumber = /\d/.test(password); 
    const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(password);

    return {
      // 3. Return the boolean result under the desired property name
      minLength: isMinLengthMet, 
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      // 4. Use the boolean result (isMinLengthMet) for the final 'isStrong' check
      isStrong: isMinLengthMet && hasLowercase && hasUppercase && hasNumber && hasSpecialChar, 
    };
}