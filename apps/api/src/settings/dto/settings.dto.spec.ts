import { createRidePresetSchema, updateRidePresetSchema } from './settings.dto';

describe('settings.dto', () => {
  it('should reject unknown fields on ride preset creation', () => {
    expect(() =>
      createRidePresetSchema.parse({
        label: 'Centro',
        value: 10,
        location: 'Centro',
        userId: 'attacker-value',
      }),
    ).toThrow();
  });

  it('should reject empty ride preset updates', () => {
    expect(() => updateRidePresetSchema.parse({})).toThrow(
      'Informe pelo menos um campo para atualização.',
    );
  });

  it('should reject unknown fields on ride preset update', () => {
    expect(() =>
      updateRidePresetSchema.parse({
        label: 'Novo nome',
        createdAt: new Date().toISOString(),
      }),
    ).toThrow();
  });
});
