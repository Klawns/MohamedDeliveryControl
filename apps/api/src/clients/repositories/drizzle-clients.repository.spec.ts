import { DrizzleClientsRepository } from './drizzle-clients.repository';

describe('DrizzleClientsRepository', () => {
  const schema = {
    clients: {
      id: 'id',
      userId: 'user_id',
    },
  };

  function createRepository(executeResult: unknown) {
    const execute = jest.fn().mockResolvedValue(executeResult);
    const repository = new DrizzleClientsRepository({
      db: { execute },
      schema,
      dialect: 'postgres',
    } as any);

    return { repository, execute };
  }

  it('should return the first client when execute resolves an array', async () => {
    const client = { id: 'client-1', userId: 'user-1', name: 'Cliente A' };
    const { repository } = createRepository([client]);

    await expect(repository.findOneForUpdate('user-1', 'client-1')).resolves.toEqual(
      client,
    );
  });

  it('should return the first client when execute resolves a rows wrapper', async () => {
    const client = { id: 'client-1', userId: 'user-1', name: 'Cliente A' };
    const { repository } = createRepository({ rows: [client] });

    await expect(repository.findOneForUpdate('user-1', 'client-1')).resolves.toEqual(
      client,
    );
  });

  it('should return undefined when execute resolves an empty payload', async () => {
    const { repository } = createRepository({ rows: [] });

    await expect(repository.findOneForUpdate('user-1', 'missing')).resolves.toBeUndefined();
  });
});
