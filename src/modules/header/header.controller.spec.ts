import { Test, TestingModule } from '@nestjs/testing';
import { HeaderController } from './header.controller.js';
import { HeaderService } from './header.service.js';

describe('HeaderController', () => {
  let controller: HeaderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeaderController],
      providers: [HeaderService],
    }).compile();

    controller = module.get<HeaderController>(HeaderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the header configuration', () => {
    expect(controller.getHeader()).toEqual(
      expect.objectContaining({
        logo: expect.any(Object),
        menu: expect.any(Array),
        buttons: expect.any(Array),
      }),
    );
  });
});