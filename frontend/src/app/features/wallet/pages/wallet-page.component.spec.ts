import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogApiService } from '../../../core/catalog/catalog-api.service';
import { WalletService } from '../../../core/wallet/wallet.service';
import { WalletPageComponent } from './wallet-page.component';

describe('WalletPageComponent', () => {
  const walletServiceMock = {
    getWallet: jasmine.createSpy('getWallet').and.resolveTo({
      userId: 'user-1',
      pointsBalance: 150,
      lifetimePoints: 300,
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    getLedger: jasmine.createSpy('getLedger').and.resolveTo({
      entries: [
        {
          id: 'entry-1',
          reason: 'session_finish_reward_first',
          delta: 42,
          referenceType: 'quiz_session',
          referenceId: 'session-1',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    }),
  };
  const catalogApiMock = {
    getCategories: jasmine.createSpy('getCategories').and.returnValue(
      of({
        categories: [
          {
            id: 'cat-2',
            slug: 'travel',
            name: 'Travel',
            unlockCost: 200,
            difficultyWeight: 1,
            isUnlocked: false,
            unlockedAt: null,
          },
        ],
      }),
    ),
  };

  beforeEach(async () => {
    walletServiceMock.getWallet.calls.reset();
    walletServiceMock.getLedger.calls.reset();
    catalogApiMock.getCategories.calls.reset();

    await TestBed.configureTestingModule({
      imports: [WalletPageComponent],
      providers: [
        { provide: WalletService, useValue: walletServiceMock },
        { provide: CatalogApiService, useValue: catalogApiMock },
      ],
    }).compileComponents();
  });

  it('laduje i wyswietla saldo oraz historie wallet', async () => {
    const fixture = TestBed.createComponent(WalletPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(walletServiceMock.getWallet).toHaveBeenCalled();
    expect(walletServiceMock.getLedger).toHaveBeenCalledWith({ limit: 50 });
    expect(catalogApiMock.getCategories).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('150 pkt');
    expect(compiled.textContent).toContain('Session finish reward first');
    expect(compiled.textContent).toContain('Travel');
  });
});
