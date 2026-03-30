import { RideStatusService } from './ride-status.service';

describe('RideStatusService', () => {
  let service: RideStatusService;
  let rideAccountingMock: any;

  beforeEach(() => {
    rideAccountingMock = {
      resolvePaymentSnapshot: jest.fn(
        ({
          value,
          paidWithBalance,
          paymentStatus,
        }: {
          value: number;
          paidWithBalance: number;
          paymentStatus?: 'PENDING' | 'PAID';
        }) => ({
          rideTotal: Number(value),
          paidWithBalance: Number(paidWithBalance ?? 0),
          paymentStatus:
            paymentStatus === 'PENDING' &&
            Number(value) - Number(paidWithBalance ?? 0) > 0
              ? 'PENDING'
              : 'PAID',
          debtValue:
            paymentStatus === 'PENDING' &&
            Number(value) - Number(paidWithBalance ?? 0) > 0
              ? Number(value) - Number(paidWithBalance ?? 0)
              : 0,
        }),
      ),
    };

    service = new RideStatusService(rideAccountingMock);
  });

  it('should rebuild debt when restoring a cancelled ride', () => {
    const result = service.prepareStatusUpdate(
      {
        id: 'ride-1',
        value: 30,
        paidWithBalance: 5,
        paymentStatus: 'PENDING',
        status: 'CANCELLED',
      } as any,
      { status: 'COMPLETED' },
    );

    expect(result).toEqual({
      status: 'COMPLETED',
      debtValue: 25,
    });
  });

  it('should calculate refund when ride value is reduced', () => {
    const result = service.prepareRideUpdate(
      {
        id: 'ride-1',
        clientId: 'client-1',
        value: 40,
        paidWithBalance: 10,
        paymentStatus: 'PENDING',
      } as any,
      { value: 6, paymentStatus: 'PENDING' },
    );

    expect(result.refundAmount).toBe(4);
    expect(result.updateData).toEqual(
      expect.objectContaining({
        value: 6,
        paidWithBalance: 6,
        paymentStatus: 'PAID',
        debtValue: 0,
      }),
    );
  });
});
