import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  it('gera hash diferente da senha original e permite comparacao', async () => {
    const service = new PasswordService();
    const password = 'SenhaSegura123';

    const passwordHash = await service.hash(password);

    expect(passwordHash).not.toBe(password);
    await expect(service.compare(password, passwordHash)).resolves.toBe(true);
    await expect(service.compare('SenhaErrada123', passwordHash)).resolves.toBe(
      false,
    );
  }, 15_000);
});
