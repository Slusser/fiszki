import { Routes } from '@angular/router';
import { AuthPageComponent } from './features/auth/pages/auth-page.component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/layout/main-layout.component';
import { CatalogPageComponent } from './features/catalog/pages/catalog-page.component';
import { QuizPageComponent } from './features/quiz/pages/quiz-page.component';
import { ProgressPageComponent } from './features/progress/pages/progress-page.component';
import { WalletPageComponent } from './features/wallet/pages/wallet-page.component';
import { unlockGuard } from './core/guards/unlock.guard';
import { SessionSummaryPageComponent } from './features/quiz/pages/session-summary-page.component';

export const routes: Routes = [
  {
    path: 'auth/:mode',
    component: AuthPageComponent,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'katalog',
      },
      {
        path: 'katalog',
        component: CatalogPageComponent,
      },
      {
        path: 'quiz',
        component: QuizPageComponent,
      },
      {
        path: 'quiz/:categoryId/:tier',
        canActivate: [unlockGuard],
        component: QuizPageComponent,
      },
      {
        path: 'quiz/sessions/:sessionId/summary',
        component: SessionSummaryPageComponent,
      },
      {
        path: 'postep',
        component: ProgressPageComponent,
      },
      {
        path: 'wallet',
        component: WalletPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
