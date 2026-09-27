import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCpf', async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)) {
      return false;
    }

    const digits = value.replace(/\D/g, '');
    if (/^(\d)\1{10}$/.test(digits)) {
      return false;
    }

    const firstDigit = this.calculateDigit(digits.slice(0, 9));
    const secondDigit = this.calculateDigit(digits.slice(0, 9) + firstDigit);

    return digits === digits.slice(0, 9) + firstDigit + secondDigit;
  }

  defaultMessage(): string {
    return 'cpfCnpj deve ser um CPF válido no formato 000.000.000-00';
  }

  private calculateDigit(value: string): number {
    let sum = 0;
    for (let index = 0; index < value.length; index += 1) {
      sum += Number(value[index]) * (value.length + 1 - index);
    }

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}
