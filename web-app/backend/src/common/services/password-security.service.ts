import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  suggestions: string[];
}

@Injectable()
export class PasswordSecurityService {
  private readonly saltRounds: number;
  private readonly minLength = 8;
  private readonly maxLength = 128;

  constructor(private configService: ConfigService) {
    // Use configurable salt rounds, default to 12 for good security/performance balance
    this.saltRounds = this.configService.get<number>(
      'app.security.saltRounds',
      12,
    );
  }

  /**
   * Hash password with configurable salt rounds
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Comprehensive password strength validation
   */
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.minLength) {
      feedback.push(
        `Password must be at least ${this.minLength} characters long`,
      );
      suggestions.push('Use a longer password');
    } else if (password.length >= this.minLength) {
      score += 20;
    }

    if (password.length > this.maxLength) {
      feedback.push(`Password must not exceed ${this.maxLength} characters`);
    }

    // Character variety checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
      password,
    );

    if (hasLowercase) score += 15;
    else {
      feedback.push('Password must contain lowercase letters');
      suggestions.push('Add lowercase letters (a-z)');
    }

    if (hasUppercase) score += 15;
    else {
      feedback.push('Password must contain uppercase letters');
      suggestions.push('Add uppercase letters (A-Z)');
    }

    if (hasNumbers) score += 15;
    else {
      feedback.push('Password must contain numbers');
      suggestions.push('Add numbers (0-9)');
    }

    if (hasSpecialChars) score += 15;
    else {
      feedback.push('Password must contain special characters');
      suggestions.push('Add special characters (!@#$%^&*)');
    }

    // Advanced security checks
    score += this.checkPatterns(password, feedback, suggestions);

    // Entropy check (approximation)
    const entropy = this.calculateEntropy(password);
    if (entropy < 40) {
      feedback.push('Password is too predictable');
      suggestions.push('Use a more random combination of characters');
    } else if (entropy > 60) {
      score += 10;
    }

    // Dictionary and common password checks
    if (this.isCommonPassword(password)) {
      feedback.push('Password is too common');
      suggestions.push('Avoid common passwords and dictionary words');
      score = Math.max(0, score - 30);
    }

    const isValid = feedback.length === 0 && score >= 70;

    return {
      isValid,
      score: Math.min(100, score),
      feedback,
      suggestions,
    };
  }

  /**
   * Check for common patterns that reduce security
   */
  private checkPatterns(
    password: string,
    feedback: string[],
    suggestions: string[],
  ): number {
    let bonusScore = 0;

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeating the same character multiple times');
      suggestions.push('Use varied characters instead of repetition');
    } else {
      bonusScore += 5;
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      feedback.push('Avoid sequential characters (abc, 123)');
      suggestions.push('Mix characters randomly instead of using sequences');
    } else {
      bonusScore += 5;
    }

    // Check for keyboard patterns
    if (this.hasKeyboardPattern(password)) {
      feedback.push('Avoid keyboard patterns (qwerty, asdf)');
      suggestions.push('Use random character combinations');
    } else {
      bonusScore += 5;
    }

    // Bonus for length beyond minimum
    if (password.length >= 12) bonusScore += 5;
    if (password.length >= 16) bonusScore += 5;

    return bonusScore;
  }

  /**
   * Calculate approximate password entropy
   */
  private calculateEntropy(password: string): number {
    const charset = this.getCharsetSize(password);
    return Math.log2(Math.pow(charset, password.length));
  }

  /**
   * Get character set size for entropy calculation
   */
  private getCharsetSize(password: string): number {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/\d/.test(password)) size += 10;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) size += 32;
    return size;
  }

  /**
   * Check for sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiopasdfghjklzxcvbnm',
      'QWERTYUIOPASDFGHJKLZXCVBNM',
    ];

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        if (password.includes(seq.substring(i, i + 3))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check for keyboard patterns
   */
  private hasKeyboardPattern(password: string): boolean {
    const patterns = [
      'qwerty',
      'asdfgh',
      'zxcvbn',
      '123456',
      '654321',
      'qwertz',
      'azerty',
      '098765',
      'mnbvcx',
    ];

    const lowerPassword = password.toLowerCase();
    return patterns.some((pattern) => lowerPassword.includes(pattern));
  }

  /**
   * Check against common passwords list
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'shadow',
      '12345678',
      'football',
      'baseball',
      'superman',
      'hello',
      'freedom',
      'whatever',
      'princess',
      'starwars',
      'computer',
      'sunshine',
      'iloveyou',
    ];

    const lowerPassword = password.toLowerCase();
    return commonPasswords.some(
      (common) =>
        lowerPassword.includes(common) || common.includes(lowerPassword),
    );
  }

  /**
   * Generate secure password suggestion
   */
  generateSecurePassword(length = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
